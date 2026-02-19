import { redis } from "../../config/redis.js";
import { EngagementRepository } from "./engagement.repository.js";
import { AppError } from "../../utils/AppError.js";
export class EngagementService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    getStatKey(targetId) {
        return `engagement:stats:${targetId}`;
    }
    async toggleLike(userId, targetId, targetType) {
        const result = await this.repository.toggleLike(userId, targetId, targetType);
        // Update Redis Counter (Write-through)
        const statKey = this.getStatKey(targetId);
        const diff = result.action === "LIKED" ? 1 : -1;
        await redis.hincrby(statKey, "likes", diff);
        // Simulation: Kafka Event Emission
        console.log(`[Kafka] Emitting event: engagement.${result.action.toLowerCase()}`, { userId, targetId, targetType });
        return result;
    }
    async react(userId, targetId, targetType, type) {
        const result = await this.repository.upsertReaction(userId, targetId, targetType, type);
        const statKey = this.getStatKey(targetId);
        if (result.action === "ADDED") {
            await redis.hincrby(statKey, `react:${type}`, 1);
        }
        else if (result.action === "REMOVED") {
            await redis.hincrby(statKey, `react:${type}`, -1);
        }
        else if (result.action === "UPDATED") {
            // This is slightly more complex, we'd need to know the OLD type to decrement it.
            // Our repository handles the DB correctly. For Redis, we might need a fetch-then-update 
            // OR just rely on periodic reconciliation for Redis accuracy on UPDATES.
            // In a real high-scale system, we'd emit a Kafka event and let a worker sync Redis.
            await this.syncCountersFromDB(targetId);
        }
        console.log(`[Kafka] Emitting event: engagement.reaction_${result.action.toLowerCase()}`, { userId, targetId, type });
        return result;
    }
    async repost(userId, postId, quoteText) {
        const repost = await this.repository.createRepost(userId, postId, quoteText);
        const statKey = this.getStatKey(postId);
        await redis.hincrby(statKey, "reposts", 1);
        console.log(`[Kafka] Emitting event: engagement.reposted`, { userId, postId });
        return repost;
    }
    async getEngagementStats(targetId) {
        const statKey = this.getStatKey(targetId);
        // 1. Try Cache
        const cached = await redis.hgetall(statKey);
        if (Object.keys(cached).length > 0) {
            return this.formatStats(cached);
        }
        // 2. Fallback to DB
        const stats = await this.repository.getCounters(targetId);
        if (!stats)
            return this.formatStats({});
        // 3. Backfill Cache
        const toCache = {
            likes: stats.likesCount.toString(),
            comments: stats.commentsCount.toString(),
            reposts: stats.repostsCount.toString(),
        };
        Object.entries(stats.reactionsCount || {}).forEach(([type, count]) => {
            toCache[`react:${type}`] = count.toString();
        });
        await redis.hset(statKey, toCache);
        await redis.expire(statKey, 3600); // 1 hour TTL for stats
        return this.formatStats(toCache);
    }
    formatStats(raw) {
        const stats = {
            likes: parseInt(raw.likes || "0"),
            comments: parseInt(raw.comments || "0"),
            reposts: parseInt(raw.reposts || "0"),
            reactions: {}
        };
        Object.entries(raw).forEach(([key, val]) => {
            if (key.startsWith("react:")) {
                const type = key.split(":")[1];
                stats.reactions[type] = parseInt(val);
            }
        });
        return stats;
    }
    async syncCountersFromDB(targetId) {
        const stats = await this.repository.getCounters(targetId);
        if (!stats)
            return;
        const statKey = this.getStatKey(targetId);
        const toCache = {
            likes: stats.likesCount.toString(),
            comments: stats.commentsCount.toString(),
            reposts: stats.repostsCount.toString(),
        };
        Object.entries(stats.reactionsCount || {}).forEach(([type, count]) => {
            toCache[`react:${type}`] = count.toString();
        });
        await redis.del(statKey);
        await redis.hset(statKey, toCache);
    }
}
//# sourceMappingURL=engagement.service.js.map