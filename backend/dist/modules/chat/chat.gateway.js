import { redis } from '../../config/redis.js';
import { Redis } from 'ioredis';
import { ChatService } from './chat.service.js';
import { ChatRepository } from './chat.repository.js';
import { wsMessageSchema, wsPayloadMessageSchema, wsPayloadTypingSchema, wsPayloadReadSchema } from './chat.schema.js';
import { MessageType } from './chat.model.js';
import jwt from 'jsonwebtoken';
import { publicKey } from '../../config/keys.js';
const subRedis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
});
const chatRepository = new ChatRepository();
const chatService = new ChatService(chatRepository);
/**
 * Enterprise Chat Gateway
 * Handles WebSocket lifecycle, real-time messaging, and multi-node synchronization.
 */
export async function chatGateway(fastify) {
    const userConnections = new Map();
    // 1. Redis Sub Listener - Cross-node event synchronization
    subRedis.on('message', (channel, message) => {
        const event = JSON.parse(message);
        if (channel.startsWith('chat:u:')) {
            const targetUserId = channel.replace('chat:u:', '');
            broadcastToUserLocally(targetUserId, event);
        }
    });
    /**
     * WebSocket Endpoint
     * Path: /chat/ws
     */
    fastify.get('/ws', { websocket: true }, (connection, req) => {
        // Debug connection object to understand runtime behavior
        // console.log('WS Connection keys:', Object.keys(connection || {}));
        // Ensure we have a valid socket instance
        // In some setups or versions, 'connection' might be the socket itself, or 'connection.socket' might be missing
        const socket = connection.socket || connection;
        if (!socket || typeof socket.close !== 'function') {
            req.log.error({ msg: 'WebSocket connection invalid: socket missing', connectionKeys: Object.keys(connection || {}) });
            if (connection && typeof connection.end === 'function')
                connection.end();
            return;
        }
        // Auth: Ensure JWT is valid
        // We manually verify here because WS connections often pass token in query param
        // and standard middleware might check headers only.
        let token;
        // 1. Try Query Param
        if (req.query.token) {
            token = req.query.token;
        }
        // 2. Try Authorization Header
        else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            req.log.warn('WebSocket connection rejected: No token provided');
            socket.close(1008, 'Unauthorized: No token provided');
            return;
        }
        let userId;
        try {
            const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
            userId = decoded.sub;
        }
        catch (err) {
            req.log.warn({ msg: 'WebSocket connection rejected: Invalid token', error: err.message });
            socket.close(1008, `Unauthorized: ${err.message}`);
            return;
        }
        // Presence: Online
        chatService.setUserPresence(userId, 'ONLINE');
        // Register connection
        if (!userConnections.has(userId)) {
            userConnections.set(userId, new Set());
            subRedis.subscribe(`chat:u:${userId}`);
        }
        userConnections.get(userId)?.add(socket);
        // Heartbeat setup
        let isAlive = true;
        const pingInterval = setInterval(() => {
            if (!isAlive)
                return socket.terminate();
            isAlive = false;
            socket.ping();
        }, 30000);
        socket.on('pong', () => { isAlive = true; });
        socket.on('message', async (raw) => {
            try {
                const data = JSON.parse(raw.toString());
                const { type, payload } = wsMessageSchema.parse(data);
                switch (type) {
                    case 'MESSAGE':
                        await handleNewMessage(userId, payload);
                        break;
                    case 'TYPING':
                        await handleTypingIndicator(userId, payload);
                        break;
                    case 'READ_RECEPT':
                        await handleReadReceipt(userId, payload);
                        break;
                }
            }
            catch (err) {
                socket.send(JSON.stringify({ type: 'ERROR', message: err.message }));
            }
        });
        socket.on('close', () => {
            clearInterval(pingInterval);
            const userConns = userConnections.get(userId);
            userConns?.delete(socket);
            if (userConns?.size === 0) {
                userConnections.delete(userId);
                subRedis.unsubscribe(`chat:u:${userId}`);
                chatService.setUserPresence(userId, 'OFFLINE');
            }
        });
    });
    async function handleNewMessage(senderId, payload) {
        const { roomId, content, msgType, mediaUrl } = wsPayloadMessageSchema.parse(payload);
        // 1. Persist to MongoDB
        const message = await chatRepository.saveMessage({
            roomId,
            senderId,
            content,
            type: msgType,
            mediaUrl
        });
        // 2. Resolve Participants
        const room = await chatRepository.findRoomById(roomId);
        if (!room)
            return;
        // 3. Fan-out to all participants via Redis Pub/Sub
        const event = { type: 'NEW_MESSAGE', payload: message };
        room.participants.forEach(participantId => {
            redis.publish(`chat:u:${participantId}`, JSON.stringify(event));
        });
    }
    async function handleTypingIndicator(userId, payload) {
        const { roomId, isTyping } = wsPayloadTypingSchema.parse(payload);
        const room = await chatRepository.findRoomById(roomId);
        if (!room)
            return;
        const event = { type: 'TYPING', payload: { roomId, userId, isTyping } };
        room.participants.filter(id => id !== userId).forEach(id => {
            redis.publish(`chat:u:${id}`, JSON.stringify(event));
        });
    }
    async function handleReadReceipt(userId, payload) {
        const { roomId, messageId } = wsPayloadReadSchema.parse(payload);
        await chatService.markAsRead(userId, roomId, messageId);
        const room = await chatRepository.findRoomById(roomId);
        if (!room)
            return;
        const event = { type: 'READ_ACK', payload: { roomId, userId, messageId } };
        room.participants.filter(id => id !== userId).forEach(id => {
            redis.publish(`chat:u:${id}`, JSON.stringify(event));
        });
    }
    function broadcastToUserLocally(userId, event) {
        const sockets = userConnections.get(userId);
        sockets?.forEach(socket => {
            if (socket.readyState === 1) {
                socket.send(JSON.stringify(event));
            }
        });
    }
}
//# sourceMappingURL=chat.gateway.js.map