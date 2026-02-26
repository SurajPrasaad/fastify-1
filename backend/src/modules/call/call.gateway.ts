import type { FastifyInstance } from 'fastify';
import { Socket } from 'socket.io';
import { db } from '../../config/drizzle.js';
import { users, blocks, callHistory } from '../../db/schema.js';
import { eq, and, or } from 'drizzle-orm';
import { redis } from '../../config/redis.js';
import { ChatRepository } from '../chat/chat.repository.js';
import { MessageType } from '../chat/chat.model.js';

const chatRepository = new ChatRepository();

export async function callGateway(app: FastifyInstance) {
    app.ready((err) => {
        if (err) throw err;

        const io = (app as any).io;
        if (!io) return;

        io.on('connection', (socket: Socket) => {
            const session = (socket.request as any).session;
            const userId = session?.userId;

            if (userId) {
                // Scalable session mapping
                redis.set(`socket:user:${userId}`, socket.id, 'EX', 86400);
            }

            const logCallToChat = async (fromId: string, toId: string, status: string, duration?: number, callType: string = 'AUDIO') => {
                try {
                    const room = await chatRepository.findOrCreateDirectRoom(fromId, toId);
                    let content = "";
                    if (status === 'MISSED') content = `Missed ${callType.toLowerCase()} call`;
                    else if (status === 'DECLINED') content = `Declined ${callType.toLowerCase()} call`;
                    else if (status === 'COMPLETED') {
                        const mins = Math.floor((duration || 0) / 60);
                        const secs = (duration || 0) % 60;
                        const durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
                        content = `${callType.toLowerCase().charAt(0).toUpperCase() + callType.toLowerCase().slice(1)} call ended • ${durationStr}`;
                    }

                    if (content) {
                        const msg = await chatRepository.saveMessage({
                            roomId: room._id.toString(),
                            senderId: fromId,
                            content: content,
                            type: MessageType.SYSTEM
                        });

                        // Notify both users in chat
                        const event = { type: 'NEW_MESSAGE', payload: msg };
                        io.to(`u:${fromId}`).emit('event', event);
                        io.to(`u:${toId}`).emit('event', event);
                    }
                } catch (err) {
                    console.error("Failed to log call to chat", err);
                }
            };

            socket.on('call:initiate', async (data: { targetUserId: string, callType: 'AUDIO' | 'VIDEO' }) => {
                if (!userId) return;

                // RATE LIMITING: Prevent call spam (1 call every 5 seconds per user)
                const rateLimitKey = `ratelimit:call:${userId}`;
                const isRateLimited = await redis.get(rateLimitKey);
                if (isRateLimited) {
                    socket.emit('error', { code: 'RATE_LIMIT_EXCEEDED', message: 'Please wait before starting another call.' });
                    return;
                }
                await redis.set(rateLimitKey, '1', 'EX', 5);

                const { targetUserId, callType } = data;
                const callId = `call_${Date.now()}_${Math.random().toString(36).substring(7)}`;

                // SECURITY: Pre-flight Permission and Block Check
                const blockStatus = await db.select().from(blocks).where(
                    or(
                        and(eq(blocks.blockerId, userId), eq(blocks.blockedId, targetUserId)),
                        and(eq(blocks.blockerId, targetUserId), eq(blocks.blockedId, userId))
                    )
                ).limit(1);

                if (blockStatus.length > 0) {
                    socket.emit('call:rejected', { callId, reason: 'PERMISSION_DENIED' });
                    return;
                }

                const caller = await db.select({
                    id: users.id, name: users.name, username: users.username, avatarUrl: users.avatarUrl
                }).from(users).where(eq(users.id, userId)).limit(1);

                if (!caller[0]) return;
                const callerData = caller[0];

                const targetSocketId = await redis.get(`socket:user:${targetUserId}`);

                if (targetSocketId) {
                    io.to(targetSocketId).emit('call:incoming', {
                        callId,
                        callerId: callerData.id,
                        callType,
                        callerName: callerData.name,
                        callerAvatar: callerData.avatarUrl,
                    });
                } else {
                    socket.emit('call:rejected', { callId, reason: 'USER_OFFLINE' });

                    // Log MISSED call in DB
                    await db.insert(callHistory).values({
                        id: callId.replace('call_', ''),
                        callerId: userId,
                        receiverId: targetUserId,
                        callType: callType,
                        status: 'MISSED'
                    });

                    logCallToChat(userId, targetUserId, 'MISSED', 0, callType);
                }
            });

            socket.on('call:accept', async (data: { callId: string, callerId: string, callType: 'AUDIO' | 'VIDEO' }) => {
                if (!userId) return;
                const targetSocketId = await redis.get(`socket:user:${data.callerId}`);
                if (targetSocketId) {
                    io.to(targetSocketId).emit('call:accepted', { callId: data.callId });
                }

                // Track initiated call
                redis.set(`call_start:${data.callId}`, Date.now().toString(), 'EX', 7200);
            });

            socket.on('call:reject', async (data: { callId: string, callerId: string, reason: string, callType: 'AUDIO' | 'VIDEO' }) => {
                if (!userId) return;
                const targetSocketId = await redis.get(`socket:user:${data.callerId}`);
                if (targetSocketId) {
                    io.to(targetSocketId).emit('call:rejected', { callId: data.callId, reason: data.reason });
                }

                // Log REJECTED call in DB
                await db.insert(callHistory).values({
                    id: data.callId.replace('call_', ''),
                    callerId: data.callerId,
                    receiverId: userId,
                    callType: data.callType || 'AUDIO',
                    status: 'REJECTED'
                });

                logCallToChat(data.callerId, userId, 'MISSED', 0, data.callType || 'AUDIO');
            });

            socket.on('call:end', async (data: { callId: string, targetUserId: string, callType: 'AUDIO' | 'VIDEO' }) => {
                if (!userId) return;
                const targetSocketId = await redis.get(`socket:user:${data.targetUserId}`);
                if (targetSocketId) {
                    io.to(targetSocketId).emit('call:ended', { callId: data.callId, reason: 'USER_ENDED' });
                }

                // Calculate duration and log COMPLETED call in DB
                const startStr = await redis.get(`call_start:${data.callId}`);
                const durationSeconds = startStr ? Math.floor((Date.now() - parseInt(startStr)) / 1000) : 0;

                await db.insert(callHistory).values({
                    id: data.callId.replace('call_', ''),
                    callerId: userId,
                    receiverId: data.targetUserId,
                    callType: data.callType || 'AUDIO',
                    status: 'COMPLETED',
                    durationSeconds: durationSeconds,
                    endedAt: new Date()
                }).onConflictDoNothing(); // Prevent race duplicates if both users click end

                logCallToChat(userId, data.targetUserId, 'COMPLETED', durationSeconds, data.callType || 'AUDIO');
            });

            socket.on('webrtc:offer', async (data: { callId: string, targetUserId: string, sdp: any }) => {
                if (!userId) return;
                const targetSocketId = await redis.get(`socket:user:${data.targetUserId}`);
                if (targetSocketId) io.to(targetSocketId).emit('webrtc:offer', { callId: data.callId, senderId: userId, sdp: data.sdp });
            });

            socket.on('webrtc:answer', async (data: { callId: string, targetUserId: string, sdp: any }) => {
                if (!userId) return;
                const targetSocketId = await redis.get(`socket:user:${data.targetUserId}`);
                if (targetSocketId) io.to(targetSocketId).emit('webrtc:answer', { callId: data.callId, senderId: userId, sdp: data.sdp });
            });

            socket.on('webrtc:ice-candidate', async (data: { callId: string, targetUserId: string, candidate: any }) => {
                if (!userId) return;
                const targetSocketId = await redis.get(`socket:user:${data.targetUserId}`);
                if (targetSocketId) io.to(targetSocketId).emit('webrtc:ice-candidate', { callId: data.callId, senderId: userId, candidate: data.candidate });
            });

            socket.on('disconnect', () => {
                if (userId) redis.del(`socket:user:${userId}`);
            });
        });
    });
}
