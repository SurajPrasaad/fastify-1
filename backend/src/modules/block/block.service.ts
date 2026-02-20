import { redis } from "../../config/redis.js";
import { BlockRepository } from "./block.repository.js";
import { AppError } from "../../utils/AppError.js";

export class BlockService {
    constructor(private blockRepository: BlockRepository) { }

    async blockUser(blockerId: string, blockedId: string) {
        if (blockerId === blockedId) {
            throw new AppError("Cannot block yourself", 400);
        }

        const result = await this.blockRepository.blockUser(blockerId, blockedId);

        // Update Redis cache for O(1) lookup
        const cacheKey = `blocks:${blockerId}`;
        await redis.sadd(cacheKey, blockedId);

        // Emit real-time event to the BLOCKED user to close connections/update UI
        const event = {
            type: 'USER_BLOCKED',
            payload: { blockerId, blockedId }
        };
        await redis.publish(`chat:u:${blockedId}`, JSON.stringify(event));

        return result;
    }

    async unblockUser(blockerId: string, blockedId: string) {
        const result = await this.blockRepository.unblockUser(blockerId, blockedId);

        // Remove from Redis cache
        const cacheKey = `blocks:${blockerId}`;
        await redis.srem(cacheKey, blockedId);

        // Emit real-time event
        const event = {
            type: 'USER_UNBLOCKED',
            payload: { blockerId, blockedId }
        };
        await redis.publish(`chat:u:${blockedId}`, JSON.stringify(event));

        return result;
    }

    async isBlocked(blockerId: string, blockedId: string) {
        const cacheKey = `blocks:${blockerId}`;
        const exists = await redis.sismember(cacheKey, blockedId);
        if (exists) return true;
        return this.blockRepository.isBlocked(blockerId, blockedId);
    }

    async getBlockedUsers(blockerId: string) {
        const result = await this.blockRepository.getBlockedUsers(blockerId);
        return result.map((item) => {
            return {
                id: item.blockedId,
                userId: item.blocked.id,
                username: item.blocked.username,
                name: item.blocked.name,
                avatarUrl: item.blocked.avatarUrl,
                blockedAt: item.createdAt
            };
        });
    }

    async getBlockStatus(blockerId: string, otherUserId: string) {
        const [isBlocked, isBlockedBy] = await Promise.all([
            this.isBlocked(blockerId, otherUserId),
            this.isBlocked(otherUserId, blockerId)
        ]);

        return { isBlocked, isBlockedBy };
    }
}
