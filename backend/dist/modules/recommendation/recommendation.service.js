import { redis } from "../../config/redis.js";
import { RecommendationRepository } from "./recommendation.repository.js";
export class RecommendationService {
    recommendationRepository;
    constructor(recommendationRepository = new RecommendationRepository()) {
        this.recommendationRepository = recommendationRepository;
    }
    /**
     * Updates User Affinity Score based on interaction.
     * Logic:
     * 1. Get tags from Post.
     * 2. Calculate score delta based on action.
     * 3. Update Redis Sorted Set for user interests.
     * 4. Mark post as 'seen'.
     */
    async trackInteraction(userId, input) {
        const { postId, action, duration } = input;
        // 1. Fetch tags for the post
        // Optimally, cache this mapping "post:tags:{id}" -> ["tag1", "tag2"]
        // Here we fetch from DB for simplicity or could be fetched from a cache service
        const tags = await this.recommendationRepository.getPostTags(postId);
        if (!tags || tags.length === 0)
            return;
        // 2. Calculate Score
        let scoreDelta = 0;
        switch (action) {
            case "VIEW":
                if (duration && duration > 5)
                    scoreDelta = 1;
                break;
            case "LIKE":
                scoreDelta = 5;
                break;
            case "SHARE":
                scoreDelta = 10;
                break;
            case "SAVE":
                scoreDelta = 8;
                break;
            case "NOT_INTERESTED":
                scoreDelta = -10;
                break;
        }
        if (scoreDelta === 0)
            return;
        // 3. Update Redis Sorted Set: user:affinity:{userId}
        // We increment the score for each tag associated with the post.
        // ZINCRBY key increment member
        const pipeline = redis.pipeline();
        const affinityKey = `user:affinity:${userId}`;
        tags.forEach((tag) => {
            pipeline.zincrby(affinityKey, scoreDelta, tag);
        });
        // 4. Mark as Seen (to avoid showing again immediately)
        // SADD user:seen:{userId} postId
        const seenKey = `user:seen:${userId}`;
        pipeline.sadd(seenKey, postId);
        // Set expiry for seen set to avoid infinite growth (e.g., 7 days)
        pipeline.expire(seenKey, 60 * 60 * 24 * 7);
        // Execute all Redis commands
        await pipeline.exec();
    }
    /**
     * Generates the "For You" feed.
     * Logic:
     * 1. Get Top 5 Tags from Redis (ZREVRANGE).
     * 2. Get Seen Posts from Redis (SMEMBERS).
     * 3. Query DB for posts matching tags, excluding seen.
     * 4. Fallback to Global Trending if no tags or not enough content.
     */
    async getForYouFeed(userId, limit = 20) {
        const affinityKey = `user:affinity:${userId}`;
        const seenKey = `user:seen:${userId}`;
        // Step 1: Get Top Interests
        // ZREVRANGE key start stop (0 4 means top 5)
        const topTags = await redis.zrevrange(affinityKey, 0, 4);
        // Step 2: Get Seen Posts
        const seenPostIds = await redis.smembers(seenKey);
        let posts = [];
        // Step 3: Fetch Personalized Content
        if (topTags.length > 0) {
            posts = await this.recommendationRepository.findByTags(topTags, limit, seenPostIds.length > 0 ? seenPostIds : []);
        }
        // Step 4: Cold Start / Fallback
        // If we didn't get enough posts (e.g., user has few interests or exhausted them),
        // fill the rest with Global Trending.
        if (posts.length < limit) {
            const remainingLimit = limit - posts.length;
            // Exclude posts we already have in the list + seen posts
            const currentIds = posts.map(p => p.id);
            const excludeIds = [...seenPostIds, ...currentIds];
            const trendingPosts = await this.recommendationRepository.getGlobalTrending(remainingLimit, excludeIds.length > 0 ? excludeIds : []);
            posts = [...posts, ...trendingPosts];
        }
        return posts;
    }
}
//# sourceMappingURL=recommendation.service.js.map