import type { FastifyInstance } from 'fastify';
import type { Socket, Server } from 'socket.io';

import { redis } from '../../config/redis.js';
import { Redis } from 'ioredis';
import { ChatService } from './chat.service.js';
import { ChatRepository } from './chat.repository.js';
import { UserRepository } from '../user/user.repository.js';
import { PresenceService, PresenceStatus } from './presence.service.js';
import {
    wsPayloadJoinRoomSchema,
    wsPayloadMessageSchema,
    wsPayloadTypingSchema,
    wsPayloadReadSchema
} from './chat.schema.js';
import jwt from 'jsonwebtoken';
import { publicKey } from '../../config/keys.js';
import { createAdapter } from "@socket.io/redis-adapter";

const subRedis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
});

const pubRedis = subRedis.duplicate(); // For adapter

const chatRepository = new ChatRepository();
const userRepository = new UserRepository();
const chatService = new ChatService(chatRepository, userRepository);

/**
 * High-Performance Chat & Presence Gateway
 */
export async function chatGateway(fastify: FastifyInstance) {
    const io = (fastify as any).io as Server;
    const presenceService = new PresenceService(chatRepository, io);

    // Periodic Cleanup of stale presence (could also be a separate worker)
    setInterval(() => presenceService.cleanupStalePresence(), 60000);

    // Use Redis adapter for multi-node support
    io.adapter(createAdapter(pubRedis, subRedis));

    // Middleware: Authentication & Device Tracking
    io.use((socket: Socket, next: (err?: Error) => void) => {
        const token = socket.handshake.query.token as string ||
            socket.handshake.auth.token as string ||
            socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
            return next(new Error('Authentication error: Token missing'));
        }

        try {
            const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as { sub: string };
            socket.data.userId = decoded.sub;
            socket.data.deviceId = socket.handshake.headers['x-device-id'] || 'web-default';
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', async (socket) => {
        const userId = socket.data.userId;
        const deviceId = socket.data.deviceId;

        // 1. Initialize Session
        socket.join(`u:${userId}`);

        // 2. Mark Online & Trigger Heartbeat
        await presenceService.heartbeat(userId, deviceId);
        await presenceService.broadcastStatus(userId, PresenceStatus.ONLINE);

        // 3. Heartbeat Listener
        socket.on('HEARTBEAT', async () => {
            await presenceService.heartbeat(userId, deviceId);
        });

        // Event Handlers
        socket.on('JOIN_ROOM', async (payload) => {
            try {
                const { roomId } = wsPayloadJoinRoomSchema.parse(payload);
                const room = await chatRepository.findRoomById(roomId);
                if (!room || !room.participants.includes(userId)) {
                    return socket.emit('ERROR', { message: "Unauthorized to join this room" });
                }
                socket.join(`room:${roomId}`);

                // Return current room presence
                const onlineParticipants = await presenceService.getRoomPresence(roomId);
                socket.emit('ROOM_PRESENCE', { roomId, onlineParticipants });
            } catch (err: any) {
                socket.emit('ERROR', { message: err.message });
            }
        });

        socket.on('SEND_MESSAGE', async (payload) => {
            try {
                const { roomId, content, type, mediaUrl } = wsPayloadMessageSchema.parse(payload);
                const message = await chatService.sendMessage(userId, roomId, content, type, mediaUrl);

                // Broadcast to all participants in the room
                io.to(`room:${roomId}`).emit('event', {
                    type: 'NEW_MESSAGE',
                    payload: message
                });
            } catch (err: any) {
                socket.emit('ERROR', { message: err.message });
            }
        });

        socket.on('TYPING', async (payload) => {
            try {
                const { roomId } = wsPayloadTypingSchema.parse(payload);
                await presenceService.setTyping(userId, roomId, true);
                socket.to(`room:${roomId}`).emit('event', {
                    type: 'USER_TYPING',
                    payload: { roomId, userId }
                });
            } catch (err) { }
        });

        socket.on('STOP_TYPING', async (payload) => {
            try {
                const { roomId } = wsPayloadTypingSchema.parse(payload);
                await presenceService.setTyping(userId, roomId, false);
                socket.to(`room:${roomId}`).emit('event', {
                    type: 'USER_STOPPED_TYPING',
                    payload: { roomId, userId }
                });
            } catch (err) { }
        });

        socket.on('READ_RECEIPT', async (payload) => {
            try {
                const { roomId, messageId } = wsPayloadReadSchema.parse(payload);
                await chatService.markAsRead(userId, roomId, messageId);

                const room = await chatRepository.findRoomById(roomId);
                if (!room) return;

                const event = { type: 'READ_ACK', payload: { roomId, userId, messageId } };
                room.participants.filter(id => id !== userId).forEach(id => {
                    io.to(`u:${id}`).emit('event', event);
                });
            } catch (err: any) {
                socket.emit('ERROR', { message: err.message });
            }
        });

        socket.on('disconnect', async () => {
            await presenceService.setOffline(userId, deviceId);
        });
    });
}

