import type { FastifyInstance } from 'fastify';
import type { Socket, Server } from 'socket.io';

import { redis } from '../../config/redis.js';
import { Redis } from 'ioredis';
import { ChatService } from './chat.service.js';
import { ChatRepository } from './chat.repository.js';
import { UserRepository } from '../user/user.repository.js';
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
 * Enterprise Chat Gateway (Socket.IO Version)
 */
export async function chatGateway(fastify: FastifyInstance) {
    const io = (fastify as any).io as Server;

    // Use Redis adapter for multi-node support
    io.adapter(createAdapter(pubRedis, subRedis));

    // Middleware: Authentication
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
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    // Redis Bridge: Listen for system-wide events and push to Socket.io
    const sub = subRedis.duplicate();
    sub.on('pmessage', (_pattern, channel, message) => {
        const event = JSON.parse(message);
        const targetUserId = channel.replace('chat:u:', '');
        io.to(`u:${targetUserId}`).emit('event', event);
    });
    sub.psubscribe('chat:u:*');

    io.on('connection', async (socket) => {

        const userId = socket.data.userId;

        // Join personal room for targeted events
        socket.join(`u:${userId}`);

        // Track presence
        const roomSize = io.sockets.adapter.rooms.get(`u:${userId}`)?.size || 0;
        if (roomSize === 1) { // First connection for this user
            chatService.setUserPresence(userId, 'ONLINE');
            broadcastPresence(userId, 'USER_ONLINE');
        }

        // Event Handlers
        socket.on('JOIN_ROOM', async (payload) => {
            try {
                const { roomId } = wsPayloadJoinRoomSchema.parse(payload);
                const room = await chatRepository.findRoomById(roomId);
                if (!room || !room.participants.includes(userId)) {
                    return socket.emit('ERROR', { message: "Unauthorized to join this room" });
                }
                socket.join(`room:${roomId}`);
            } catch (err: any) {
                socket.emit('ERROR', { message: err.message });
            }
        });

        socket.on('SEND_MESSAGE', async (payload) => {
            try {
                const { roomId, content, msgType, mediaUrl } = wsPayloadMessageSchema.parse(payload);
                const message = await chatService.sendMessage(userId, roomId, content, msgType, mediaUrl);
                // Broadcast is handled inside chatService.sendMessage via Redis, 
                // but we can also do it here if we want to bypass the extra Redis hop for local node.
                // However, stick to service logic for consistency.
            } catch (err: any) {
                socket.emit('ERROR', { message: err.message });
            }
        });

        socket.on('TYPING', async (payload) => {
            handleTyping(socket, userId, payload, true);
        });

        socket.on('STOP_TYPING', async (payload) => {
            handleTyping(socket, userId, payload, false);
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

        socket.on('disconnect', () => {

            const stillConnected = io.sockets.adapter.rooms.get(`u:${userId}`)?.size || 0;
            if (stillConnected === 0) {
                chatService.setUserPresence(userId, 'OFFLINE');
                broadcastPresence(userId, 'USER_OFFLINE');
            }
        });
    });

    // Helper: Redundant presence broadcast across nodes
    async function broadcastPresence(userId: string, type: 'USER_ONLINE' | 'USER_OFFLINE') {
        const rooms = await chatRepository.findUserRooms(userId, 100, 0);
        const event = { type, payload: { userId } };
        const notified = new Set<string>();

        rooms.forEach(room => {
            room.participants.filter(pId => pId !== userId).forEach(pId => notified.add(pId));
        });

        notified.forEach(pId => {
            io.to(`u:${pId}`).emit('event', event);
        });
    }

    async function handleTyping(socket: any, userId: string, payload: any, isTyping: boolean) {
        try {
            const { roomId } = wsPayloadTypingSchema.parse(payload);
            const room = await chatRepository.findRoomById(roomId);
            if (!room || !room.participants.includes(userId)) return;

            const event = {
                type: isTyping ? 'USER_TYPING' : 'USER_STOPPED_TYPING',
                payload: { roomId, userId }
            };

            socket.to(`room:${roomId}`).emit('event', event);
        } catch (err) { }
    }
}

// Subscription handle for system-wide events (e.g. from ChatService)
// We need to bridge Redis PubSub (used in ChatService) to Socket.io
subRedis.subscribe('chat:internal', (err) => {
    if (err) console.error('Redis Subscribe Error:', err);
});

subRedis.on('message', (channel, message) => {
    if (channel === 'chat:internal') {
        const { targetUserId, event } = JSON.parse(message);
        // This is where external services (like ChatService) can trigger socket emits
        // But since we use the Redis Adapter, Socket.io handles cross-node emits automatically
        // if we use io.to(userId).
    }
});
