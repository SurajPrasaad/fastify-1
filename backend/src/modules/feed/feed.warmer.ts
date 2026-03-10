
import { FeedService } from "./feed.service.js";
import { FeedRepository } from "./feed.repository.js";
import { redis } from "../../config/redis.js";

/**
 * Feed Cache Warmer
 * 
 * Pre-generates feeds for active users to ensure <150ms P95 latency.
 * Handles both "Following" (fan-out) and "For You" (algorithmic) feeds.
 */
export class FeedWarmer {
    private service: FeedService;
    private repository: FeedRepository;

    constructor() {
        this.repository = new FeedRepository();
        this.service = new FeedService(this.repository);
    }

    /**
     * Warm up feeds for active users.
     */
    async warm(userLimit: number = 500): Promise<void> {
        console.log(`🔥 Warming Feed Cache for top ${userLimit} active users...`);
        const startTime = Date.now();

        try {
            // 1. Get IDs of users active in the last 7 days
            const userIds = await this.repository.getActiveUserIds(userLimit);

            if (userIds.length === 0) {
                console.log("ℹ️ No active users found to warm feeds for.");
                return;
            }

            console.log(`📡 Warming feeds for ${userIds.length} users...`);

            // 2. Process in small batches to avoid blocking or memory issues
            const batchSize = 25;
            for (let i = 0; i < userIds.length; i += batchSize) {
                const batch = userIds.slice(i, i + batchSize);

                await Promise.all(batch.map(async (userId) => {
                    // Following Feed
                    // Note: getFollowingFeed doesn't write back to Redis in the current service code.
                    // We call it here to ensure hot data is in Postgres buffers and some parts of Redis.
                    // However, we should also invoke For You warming which DOES write to Redis.
                    await Promise.all([
                        this.service.getFeed(userId, 'FOLLOWING', 20),
                        this.service.getFeed(userId, 'FOR_YOU', 20)
                    ]);
                }));

                const progress = Math.round(((i + batch.length) / userIds.length) * 100);
                if (progress % 20 === 0) { // Log every 20%
                    console.log(`⏳ Progress: ${progress}%...`);
                }
            }

            const duration = Date.now() - startTime;
            console.log(`✅ Feed Cache Warmed in ${duration}ms (${userIds.length} users processed)`);
        } catch (err) {
            console.error("❌ Failed to warm Feed Cache:", err);
        }
    }

    /**
     * Simple check to see if warming is recommended
     */
    async isWarmNeeded(): Promise<boolean> {
        // Find one active user and check if their For You feed is cached
        const activeUsers = await this.repository.getActiveUserIds(1);
        if (activeUsers.length === 0) return false;

        const exists = await redis.exists(`feed:foryou:${activeUsers[0]}`);
        return !exists;
    }
}

export const feedWarmer = new FeedWarmer();
