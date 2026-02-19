import { ChatRepository } from "./chat.repository.js";
import { redis } from "../../config/redis.js";
import { AppError } from "../../utils/AppError.js";
import { MessageType } from "./chat.model.js";
export class ChatService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async getUserPresence(userId) {
        const status = await redis.get(`presence:${userId}`);
        const lastSeen = await redis.get(`last_seen:${userId}`);
        return {
            userId,
            status: status || 'OFFLINE',
            lastSeen: lastSeen ? new Date(parseInt(lastSeen)) : null
        };
    }
    async setUserPresence(userId, status) {
        if (status === 'ONLINE') {
            await redis.set(`presence:${userId}`, 'ONLINE', 'EX', 60); // 60s TTL for heartbeat
        }
        else {
            await redis.del(`presence:${userId}`);
            await redis.set(`last_seen:${userId}`, Date.now().toString());
        }
        // Simulation: Kafka event
        console.log(`[Kafka] Emitting event: user.presence_changed`, { userId, status });
    }
    async getHistory(roomId, userId, limit, before) {
        const room = await this.repository.findRoomById(roomId);
        if (!room || !room.participants.includes(userId)) {
            throw new AppError("Room not found or access denied", 403);
        }
        return await this.repository.getRoomMessages(roomId, limit, before);
    }
    async getConversations(userId, limit, offset) {
        return await this.repository.findUserRooms(userId, limit, offset);
    }
    async createRoom(creatorId, participants, type, name) {
        if (type === 'DIRECT') {
            const recipientId = participants[0];
            if (!recipientId || participants.length !== 1) {
                throw new AppError("Direct chat requires exactly 1 participant", 400);
            }
            return await this.repository.findOrCreateDirectRoom(creatorId, recipientId);
        }
        return await this.repository.createGroupRoom(name || "New Group", participants, creatorId);
    }
    async markAsRead(userId, roomId, messageId) {
        return await this.repository.updateReadState(userId, roomId, messageId);
    }
}
//# sourceMappingURL=chat.service.js.map