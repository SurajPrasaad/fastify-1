
import { ExploreRepository } from "./explore.repository.js";
import { redis } from "../../config/redis.js";

/**
 * Explore Cache Warmer
 * 
 * Pre-populates Redis with trending posts and metadata to ensure 
 * sub-150ms P95 latency for the first users after a restart or deployment.
 * 
 * Warming Strategy:
 * 1. Trending Global: Top 1000 posts by engagement velocity (48h window)
 * 2. Trending Categories: Top 5 categories with top 100 posts each
 * 3. Hot Post Hydration: Top 100 trending posts full objects in Redis
 */
export class ExploreWarmer {
    private repository: ExploreRepository;

    constructor() {
        this.repository = new ExploreRepository();
    }

    /**
     * Warm the explore cache.
     * Should be called during server startup or via cron.
     */
    async warm(): Promise<void> {
        console.log("🔥 Warming Explore Cache...");
        const startTime = Date.now();

        try {
            // 1. Fetch top trending candidates from PostgreSQL
            const trendingPosts = await this.repository.getFallbackTrending(1000);

            if (trendingPosts.length === 0) {
                console.log("ℹ️ No posts found to warm cache with.");
                return;
            }

            console.log(`📡 Fetched ${trendingPosts.length} trending candidates from DB.`);

            const pipeline = redis.pipeline();

            // 2. Map posts to Redis trending scores
            for (const post of trendingPosts) {
                const ageHours = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);

                // Reuse the trending formula from ExploreService
                const engagementRaw = post.likesCount + post.commentsCount * 2 + post.repostsCount * 3;
                const velocity = engagementRaw / (ageHours + 2);
                const freshness = Math.exp(-ageHours / 48);
                const trendingScore = (velocity * 0.6) + (freshness * 100 * 0.4);

                // Add to Global Trending ZSET
                pipeline.zadd("explore:trending:global", trendingScore.toString(), post.id);

                // Add to Category ZSETs (Top 5 tags)
                if (post.tags && post.tags.length > 0) {
                    for (const tag of post.tags.slice(0, 5)) {
                        pipeline.zadd(`explore:trending:cat:${tag}`, trendingScore.toString(), post.id);
                    }
                }

                // 3. Hydrate "Hot" posts (Top 100)
                if (trendingPosts.indexOf(post) < 100) {
                    const cacheKey = `explore:post:hydrated:${post.id}`;
                    pipeline.setex(cacheKey, 600, JSON.stringify(post)); // 10 min TTL
                }
            }

            // Cleanup old entries (cap at 10,000 global, 2,000 per category)
            pipeline.zremrangebyrank("explore:trending:global", 0, -10001);

            await pipeline.exec();

            const duration = Date.now() - startTime;
            console.log(`✅ Explore Cache Warmed in ${duration}ms (${trendingPosts.length} posts indexed)`);
        } catch (err) {
            console.error("❌ Failed to warm Explore Cache:", err);
        }
    }

    /**
     * Check if warming is needed (e.g., if Redis is empty)
     */
    async isWarmNeeded(): Promise<boolean> {
        const count = await redis.zcard("explore:trending:global");
        return count < 100; // Warm if we have fewer than 100 trending posts
    }
}

export const exploreWarmer = new ExploreWarmer();
