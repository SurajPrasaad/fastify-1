import type { FastifyInstance } from 'fastify';
import type { Socket, Server } from 'socket.io';
import { RoomRepository } from './room.repository.js';
import { RoomPresenceService, RoomRole } from './presence.service.js';
import { z } from 'zod';
import { db } from '../../config/drizzle.js';

const roomJoinSchema = z.object({
    roomId: z.string().uuid()
});

const produceSchema = z.object({
    roomId: z.string().uuid(),
    kind: z.enum(['audio', 'video']).default('audio'),
    rtpParameters: z.any().optional()
});

const consumeSchema = z.object({
    roomId: z.string().uuid(),
    producerId: z.string()
});

const speakingSchema = z.object({
    roomId: z.string().uuid(),
    isSpeaking: z.boolean()
});

/**
 * Gateway to handle WebRTC audio streaming, listener state,
 * and routing signals for Group Audio Rooms.
 */
export async function roomGateway(app: FastifyInstance) {
    app.ready((err) => {
        if (err) throw err;

        const io = (app as any).io as Server;
        if (!io) return;

        const repository = new RoomRepository();
        const presence = new RoomPresenceService();

        io.on('connection', async (socket: Socket) => {
            const userId = socket.data?.userId as string;
            const logPrefix = `[RoomGateway][User:${userId}]`;

            if (!userId) {
                app.log.warn(`${logPrefix} Connection rejected: Missing userId`);
                return;
            }

            // Join personal room for private signaling
            socket.join(userId);

            /**
             * Helper to wrap events in robust error handling and logging
             */
            const handleEvent = async (eventName: string, payload: any, handler: Function, callback?: Function) => {
                try {
                    app.log.debug(`${logPrefix} Handling ${eventName}`);
                    const result = await handler(payload);
                    if (callback) callback({ success: true, ...result });
                } catch (error: any) {
                    app.log.error(`${logPrefix} Error in ${eventName}: ${error.message}`);
                    socket.emit('error', {
                        event: eventName,
                        code: 'INTERNAL_ERROR',
                        message: error.message
                    });
                    if (callback) callback({ success: false, message: error.message });
                }
            };

            // 1. Join Audio Room
            socket.on('audio_room:join', (payload) => handleEvent('audio_room:join', payload, async (data: any) => {
                const { roomId } = roomJoinSchema.parse(data);

                const room = await repository.getRoomById(roomId);
                if (!room) throw new Error("Room not found");
                if (room.status === 'ENDED') throw new Error("Room has already ended");

                const isHost = room.hostId === userId;
                const role = isHost ? RoomRole.HOST : RoomRole.LISTENER;

                await presence.join(roomId, userId, role);
                await repository.addParticipant(roomId, userId, isHost ? "HOST" : "LISTENER");

                const user = await db.query.users.findFirst({
                    where: (u: any, { eq }: any) => eq(u.id, userId),
                    columns: { id: true, username: true, name: true, avatarUrl: true }
                });

                socket.join(`room:${roomId}`);

                const participants = await presence.getParticipants(roomId);

                // Broadcast to others
                socket.to(`room:${roomId}`).emit('audio_room:participant_joined', {
                    userId,
                    user,
                    role
                });

                return { roomId, role, participants };
            }));

            // 2. Leave Audio Room
            socket.on('audio_room:leave', (payload) => handleEvent('audio_room:leave', payload, async (data: any) => {
                const { roomId } = roomJoinSchema.parse(data);

                await presence.leave(roomId, userId);
                await repository.removeParticipant(roomId, userId);

                socket.leave(`room:${roomId}`);
                io.to(`room:${roomId}`).emit('audio_room:participant_left', { userId });

                return { success: true };
            }));

            // Handle disconnect if in a room
            socket.on('disconnecting', async () => {
                const roomsSids = Array.from(socket.rooms);
                for (const r of roomsSids) {
                    if (r.startsWith('room:')) {
                        const roomId = r.replace('room:', '');
                        try {
                            await presence.leave(roomId, userId);
                            await repository.removeParticipant(roomId, userId);
                            socket.to(r).emit('audio_room:participant_left', { userId });
                        } catch (e) {
                            app.log.error(`${logPrefix} Disconnect cleanup failed for room ${roomId}`);
                        }
                    }
                }
            });

            // 3. Signaling: Get TURN Credentials
            socket.on('audio_room:get_turn_credentials', async (data: any, callback: Function) => {
                try {
                    const { turnService } = await import('../call/turn.service.js');
                    const credentials = await turnService.issue(userId);
                    if (callback) callback({ success: true, credentials });
                } catch (error: any) {
                    app.log.error(`${logPrefix} TURN Error: ${error.message}`);
                    if (callback) callback({ success: false, message: error.message });
                }
            });

            // 4. Signaling: Relay WebRTC signals (Offers, Answers, ICE Candidates)
            socket.on('audio_room:signal', (payload) => handleEvent('audio_room:signal', payload, async (data: any) => {
                const { roomId, targetUserId, signal } = data;
                
                if (!roomId || !targetUserId || !signal) {
                    throw new Error("Invalid signaling payload");
                }

                // Verify both users are in the same room (optional but good)
                // Forward signal to target user ONLY
                io.to(targetUserId).emit('audio_room:signal', {
                    senderId: userId,
                    signal
                });

                return { success: true };
            }));

            // 4. Voice Activity: Broadcast speaking status
            socket.on('audio_room:speaking', (payload) => handleEvent('audio_room:speaking', payload, async (data: any) => {
                const { roomId, isSpeaking } = speakingSchema.parse(data);
                socket.to(`room:${roomId}`).emit('audio_room:speaking_status', {
                    userId,
                    isSpeaking
                });
                return { success: true };
            }));
        });
    });
}
