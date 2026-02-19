
import { FeedRepository } from "./feed.repository.js";
import { redis } from "../../config/redis.js";

export class FeedService {
    constructor(private feedRepository: FeedRepository) { }

    private getUserFeedKey(userId: string) {
        return `feed:home:${userId}`;
    }

    /**
     * Home Feed - Hybrid Fan-out Model
     * Normal Users: Fan-out on Write (IDs pushed to Redis ZSET)
     * Celebrities: Fan-out on Read (Merged from DB/Cache at request time)
     */
    async getHomeFeed(userId: string, limit: number, cursor?: string) {
        const feedKey = this.getUserFeedKey(userId);

        // 1. Fetch from Fan-out (Push) cache - Redis ZSET
        // Using ZREVRANGEBYSCORE for cursor-based pagination
        const maxScore = cursor ? parseFloat(cursor) : Infinity;
        const stopScore = -Infinity;

        const cachedPostIdsWithScores = await redis.zrevrangebyscore(
            feedKey,
            maxScore,
            stopScore,
            'LIMIT', 0, limit
        );

        // 2. Fetch from Fan-out (Pull) source - Celebrity Posts
        const celebrityPosts = await this.feedRepository.getCelebrityPosts(userId, limit, cursor);

        // 3. Merge and Rank
        // Note: In a production FAANG system, we'd have a separate Ranking Service.
        // For this implementation, we combine cached pushed posts with pulled celebrity posts.
        const pushedPosts = await this.feedRepository.findByIds(cachedPostIdsWithScores);

        const mergedPosts = [...pushedPosts, ...celebrityPosts];

        // Deduplicate and re-rank
        const uniquePosts = Array.from(new Map(mergedPosts.map(p => [p.id, p])).values());

        // Final Top-K Ranking
        const rankedPosts = uniquePosts
            .map(post => ({
                ...post,
                rankScore: this.calculateRankScore(post)
            }))
            .sort((a, b) => b.rankScore - a.rankScore)
            .slice(0, limit);

        return rankedPosts;
    }

    /**
     * Ranking Algorithm (Pseudo-code implementation)
     * Score = (EngagementVelocity * 0.4) + (Recency * 0.4) + (Affinity * 0.2)
     */
    private calculateRankScore(post: any): number {
        const now = Date.now();
        const ageInHours = (now - post.publishedAt.getTime()) / (1000 * 60 * 60);

        const recencyScore = Math.exp(-ageInHours / 24); // Exponential decay (24h half-life)
        const engagementScore = (post.likesCount + post.commentsCount * 2) / (ageInHours + 2);

        // Default affinity for simplified demo
        const affinityScore = 1.0;

        return (recencyScore * 40) + (engagementScore * 40) + (affinityScore * 20);
    }

    /**
     * Fan-out Worker Logic (Triggered by post.created event)
     */
    async handlePostCreated(postId: string, creatorId: string) {
        // 1. Check if creator is a celebrity
        const isCelebrity = await this.feedRepository.isCelebrity(creatorId);
        if (isCelebrity) {
            // No fan-out needed for celebrities (Pull model)
            return;
        }

        // 2. Fan-out to followers in batches
        let offset = 0;
        const batchSize = 1000;

        // This would typically be a distributed background job (e.g., BullMQ or Sidekiq)
        while (true) {
            const followers = await this.feedRepository.getFollowerIds(creatorId, batchSize, offset);
            if (followers.length === 0) break;

            const pipeline = redis.pipeline();
            for (const follower of followers) {
                const feedKey = this.getUserFeedKey(follower.followerId);
                const post = await this.feedRepository.findByIds([postId]); // Efficiency: cache this
                const score = post[0] ? this.calculateRankScore(post[0]) : Date.now();

                pipeline.zadd(feedKey, score.toString(), postId);
                pipeline.zremrangebyrank(feedKey, 0, -1001); // Keep last 1000 items
                pipeline.expire(feedKey, 7 * 24 * 3600); // 1 week TTL
            }
            await pipeline.exec();

            offset += batchSize;
        }
    }

    /**
     * Smart Rebalancing - Update post rank across active feeds
     */
    async rebalancePost(postId: string) {
        // Typically triggered by viral engagement spikes
        // In high-scale, we only update for active users recently logged in
        console.log(`[Rebalance] Triggered for post ${postId}`);
        // Implementation would involve updating ZSET scores for relevant users
    }
}
