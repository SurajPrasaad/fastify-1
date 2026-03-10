
import { redis } from "../../config/redis.js";
import { ChatRepository } from "./chat.repository.js";
import type { Server } from "socket.io";

export enum PresenceStatus {
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE',
    IDLE = 'IDLE',
    TYPING = 'TYPING'
}

export interface UserPresence {
    userId: string;
    status: PresenceStatus;
    lastSeen: number;
    deviceId?: string;
}

export class PresenceService {
    private readonly HEARTBEAT_INTERVAL = 30; // seconds
    private readonly HEARTBEAT_TTL = 90; // seconds
    private readonly IDLE_THRESHOLD = 300; // 5 minutes

    constructor(
        private chatRepository: ChatRepository,
        private io: Server
    ) { }

    /**
     * Update user heartbeat and handle online transition
     */
    async heartbeat(userId: string, deviceId: string = 'default') {
        const timestamp = Date.now();
        const userKey = `presence:u:${userId}`;
        const heartbeatKey = `presence:v_heartbeat`; // Virtual heartbeat tracker
        const deviceKey = `presence:u:${userId}:devices`;

        // 1. Transactional update
        const multi = redis.multi();

        // Tag user as online
        multi.hset(userKey, {
            status: PresenceStatus.ONLINE,
            lastHeartbeat: timestamp,
            lastSeen: timestamp
        });
        multi.expire(userKey, this.HEARTBEAT_TTL);

        // Track active devices
        multi.sadd(deviceKey, deviceId);
        multi.expire(deviceKey, this.HEARTBEAT_TTL);

        // Add to global heartbeat ZSET for cleanup worker
        multi.zadd(heartbeatKey, timestamp, userId);

        await multi.exec();

        // 2. Identify if this is a new "Global Online" event
        // (If we want to avoid redundant broadcasts)
        // For now, simpler: check if we should notify friends
        // In a real FAANG system, we'd use a more sophisticated diffing or cache layer
    }

    /**
     * Explicitly set user offline (e.g. on graceful disconnect)
     */
    async setOffline(userId: string, deviceId: string = 'default') {
        const userKey = `presence:u:${userId}`;
        const deviceKey = `presence:u:${userId}:devices`;
        const heartbeatKey = `presence:v_heartbeat`;

        // Remove device
        await redis.srem(deviceKey, deviceId);
        const remainingDevices = await redis.scard(deviceKey);

        if (remainingDevices === 0) {
            const timestamp = Date.now();
            await redis.hset(userKey, {
                status: PresenceStatus.OFFLINE,
                lastSeen: timestamp
            });
            await redis.zrem(heartbeatKey, userId);

            // Broadcast offline to relevant circles
            await this.broadcastStatus(userId, PresenceStatus.OFFLINE);
        }
    }

    /**
     * Set typing status for a room
     */
    async setTyping(userId: string, roomId: string, isTyping: boolean) {
        const typingKey = `typing:r:${roomId}`;
        if (isTyping) {
            await redis.hset(typingKey, userId, Date.now());
            await redis.expire(typingKey, 10); // Auto-expire typing status
        } else {
            await redis.hdel(typingKey, userId);
        }
    }

    /**
     * Scan and cleanup stale presence
     * Should be called by a cron or a worker
     */
    async cleanupStalePresence() {
        const heartbeatKey = `presence:v_heartbeat`;
        const threshold = Date.now() - (this.HEARTBEAT_TTL * 1000);

        const staleUserIds = await redis.zrangebyscore(heartbeatKey, '-inf', threshold);

        if (staleUserIds.length > 0) {
            for (const userId of staleUserIds) {
                await this.setOffline(userId, 'any'); // Force offline
            }
            await redis.zremrangebyscore(heartbeatKey, '-inf', threshold);
        }
    }

    /**
     * Broadcast status to all relevant participants (friends/room members)
     * Optimized for multi-node scalability using Socket.io room batching.
     */
    async broadcastStatus(userId: string, status: PresenceStatus) {
        // Optimized Fan-out:
        const rooms = await this.chatRepository.findUserRooms(userId, 100, 0);
        const event = {
            type: status === PresenceStatus.ONLINE ? 'USER_ONLINE' : 'USER_OFFLINE',
            payload: { userId, status, timestamp: Date.now() }
        };

        const targetRooms: string[] = [];
        const participantIds = new Set<string>();

        for (const room of rooms) {
            room.participants.forEach(pId => {
                if (pId !== userId) participantIds.add(`u:${pId}`);
            });
        }

        // Convert Set to Array for batch emission
        const batch = Array.from(participantIds);

        if (batch.length > 0) {
            // Emitting to an array of rooms is natively optimized by Socket.io 
            // and the Redis adapter to reduce cross-node pub/sub noise.
            this.io.to(batch).emit('event', event);
        }
    }

    /**
     * Get aggregate presence for a room
     */
    async getRoomPresence(roomId: string): Promise<string[]> {
        const room = await this.chatRepository.findRoomById(roomId);
        if (!room) return [];

        const onlineUsers: string[] = [];
        for (const pId of room.participants) {
            const isOnline = await redis.exists(`presence:u:${pId}`);
            if (isOnline) onlineUsers.push(pId);
        }
        return onlineUsers;
    }
}
