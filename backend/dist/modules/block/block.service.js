import { redis } from "../../config/redis.js";
import { BlockRepository } from "./block.repository.js";
import { AppError } from "../../utils/AppError.js";
export class BlockService {
    blockRepository;
    constructor(blockRepository) {
        this.blockRepository = blockRepository;
    }
    async blockUser(blockerId, blockedId) {
        if (blockerId === blockedId) {
            throw new AppError("Cannot block yourself", 400);
        }
        const result = await this.blockRepository.blockUser(blockerId, blockedId);
        // Update Redis cache for O(1) lookup
        const cacheKey = `blocks:${blockerId}`;
        await redis.sadd(cacheKey, blockedId);
        return result;
    }
    async unblockUser(blockerId, blockedId) {
        const result = await this.blockRepository.unblockUser(blockerId, blockedId);
        // Remove from Redis cache
        const cacheKey = `blocks:${blockerId}`;
        await redis.srem(cacheKey, blockedId);
        return result;
    }
    async isBlocked(blockerId, blockedId) {
        const cacheKey = `blocks:${blockerId}`;
        // 1. Try Cache
        const exists = await redis.sismember(cacheKey, blockedId);
        if (exists)
            return true;
        // 2. Fallback to DB if cache is missing (though we should usually keep sets fresh)
        // For a true 100M user system, we might use a Bloom filter or ensure the set is populated.
        return this.blockRepository.isBlocked(blockerId, blockedId);
    }
}
//# sourceMappingURL=block.service.js.map