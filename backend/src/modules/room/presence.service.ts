
import { redis } from "../../config/redis.js";

export enum RoomRole {
    HOST = 'HOST',
    SPEAKER = 'SPEAKER',
    LISTENER = 'LISTENER'
}

export interface RoomParticipantMeta {
    userId: string;
    role: RoomRole;
    joinedAt: number;
}

/**
 * Scalable Audio Room Presence Service
 * Uses Redis (Sets and Hashes) for low-latency participant tracking.
 */
export class RoomPresenceService {
    private readonly ROOM_PREFIX = 'audio_room:';
    private readonly PARTICIPANT_TTL = 3600; // 1 hour (auto-cleanup if room hangs)

    /**
     * Track a user joining an audio room in Redis.
     */
    async join(roomId: string, userId: string, role: RoomRole) {
        const setKey = `${this.ROOM_PREFIX}${roomId}:participants`;
        const metaKey = `${this.ROOM_PREFIX}${roomId}:meta:${userId}`;

        const meta: RoomParticipantMeta = {
            userId,
            role,
            joinedAt: Date.now()
        };

        const multi = redis.multi();
        multi.sadd(setKey, userId);
        multi.hset(metaKey, meta as any);
        multi.expire(setKey, this.PARTICIPANT_TTL);
        multi.expire(metaKey, this.PARTICIPANT_TTL);

        await multi.exec();
    }

    /**
     * Remove a user from the room.
     */
    async leave(roomId: string, userId: string) {
        const setKey = `${this.ROOM_PREFIX}${roomId}:participants`;
        const metaKey = `${this.ROOM_PREFIX}${roomId}:meta:${userId}`;

        const multi = redis.multi();
        multi.srem(setKey, userId);
        multi.del(metaKey);
        await multi.exec();
    }

    /**
     * Get all currently active participants in a room.
     */
    async getParticipants(roomId: string): Promise<RoomParticipantMeta[]> {
        const setKey = `${this.ROOM_PREFIX}${roomId}:participants`;
        const userIds = await redis.smembers(setKey);

        if (userIds.length === 0) return [];

        const results: RoomParticipantMeta[] = [];
        for (const userId of userIds) {
            const meta = await redis.hgetall(`${this.ROOM_PREFIX}${roomId}:meta:${userId}`);
            if (Object.keys(meta).length > 0) {
                results.push(meta as unknown as RoomParticipantMeta);
            }
        }
        return results;
    }

    /**
     * Efficiently count participants (useful for feed overview)
     */
    async getCount(roomId: string): Promise<number> {
        return await redis.scard(`${this.ROOM_PREFIX}${roomId}:participants`);
    }

    async isUserInRoom(roomId: string, userId: string): Promise<boolean> {
        const setKey = `${this.ROOM_PREFIX}${roomId}:participants`;
        return await redis.sismember(setKey, userId) === 1;
    }

    /**
     * Clear all room state when a room ends.
     */
    async cleanup(roomId: string) {
        const setKey = `${this.ROOM_PREFIX}${roomId}:participants`;
        const userIds = await redis.smembers(setKey);

        const multi = redis.multi();
        for (const userId of userIds) {
            multi.del(`${this.ROOM_PREFIX}${roomId}:meta:${userId}`);
        }
        multi.del(setKey);
        await multi.exec();
    }
}
