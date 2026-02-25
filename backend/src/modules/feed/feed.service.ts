
import { FeedRepository } from "./feed.repository.js";
import { redis } from "../../config/redis.js";

export class FeedService {
    constructor(private feedRepository: FeedRepository) { }

    private getUserFeedKey(userId: string) {
        return `feed:following:${userId}`;
    }

    /**
     * Home Feed - Hybrid Fan-out Model
     * Normal Users: Fan-out on Write (IDs pushed to Redis ZSET)
     * Celebrities: Fan-out on Read (Merged from DB/Cache at request time)
     */
    async getFeed(userId: string, type: 'FOR_YOU' | 'FOLLOWING', limit: number, cursor?: string) {
        if (type === 'FOLLOWING') {
            return this.getFollowingFeed(userId, limit, cursor);
        } else {
            return this.getForYouFeed(userId, limit, cursor);
        }
    }

    /**
     * FOLLOWING FEED: Chronological + Graph-aware
     * Hybrid Fan-out on Write (ZSET) + Pull from Celebrities
     */
    private async getFollowingFeed(userId: string, limit: number, cursor?: string) {
        const feedKey = `feed:following:${userId}`;

        // 1. Fetch from Fan-out Cache (Push)
        const maxScore = cursor ? parseFloat(cursor) : Infinity;
        const cachedIds = await redis.zrevrangebyscore(feedKey, maxScore, -Infinity, 'LIMIT', 0, limit);

        // 2. Fetch Celebrity Posts (Pull)
        const celebrityPosts = await this.feedRepository.getCelebrityPosts(userId, limit, cursor);

        // 3. Merge and Rank chronologically
        let posts = await this.feedRepository.findByIds(cachedIds);
        posts = [...posts, ...celebrityPosts];

        // 4. Deduplicate and Sort
        const uniquePosts = Array.from(new Map(posts.map(p => [p.id, p])).values());

        // 5. Filter blocked/muted users
        const blockedUserIds = await this.feedRepository.getBlockedUserIds(userId);
        const filteredPosts = uniquePosts.filter(p => !blockedUserIds.includes(p.userId));

        return filteredPosts
            .sort((a, b) => {
                const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
                const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
                return bTime - aTime;
            })
            .slice(0, limit);
    }

    /**
     * FOR YOU FEED: Algorithmic + Discovery
     * Personalized ranking model mix: Following + Recommended + Trending
     */
    private async getForYouFeed(userId: string, limit: number, cursor?: string) {
        const feedKey = `feed:foryou:${userId}`;

        // 1. Check personalized cache first
        const maxScore = cursor ? parseFloat(cursor) : 10000; // Rank scores are roughly 0-100
        const cachedIds = await redis.zrevrangebyscore(feedKey, maxScore.toString(), '0', 'LIMIT', 0, limit);

        if (cachedIds.length > 0) {
            return await this.feedRepository.findByIds(cachedIds);
        }

        // 2. Cache Miss - Candidate Generation (Lazy Build)
        // a. Segment from Following (20 items)
        const followingCandidates = await this.feedRepository.getHomeFeedFallback(userId, 20);

        // b. Segment from Trending (20 items)
        const blockedUserIds = await this.feedRepository.getBlockedUserIds(userId);
        const trendingCandidates = await this.feedRepository.getTrendingPosts(20, followingCandidates.map(p => p.id));

        // 3. Enrichment and Ranking
        const candidates = [...followingCandidates, ...trendingCandidates];
        const uniqueCandidates = Array.from(new Map(candidates.map(p => [p.id, p])).values());

        // 4. ML Selection Logic
        const affinityScores = await this.feedRepository.getAffinityScores(userId);
        const affinityMap = new Map(affinityScores.map(s => [s.targetUserId, s.score]));

        const ranked = uniqueCandidates.map(post => {
            const affinity = affinityMap.get(post.userId) || 0.1;
            const baseRank = this.calculateRankScore(post);
            return {
                ...post,
                finalScore: baseRank * (1 + affinity)
            };
        }).sort((a, b) => b.finalScore - a.finalScore);

        // 5. Async: Warm up cache for next request
        if (ranked.length > 0) {
            const pipeline = redis.pipeline();
            ranked.forEach(p => {
                pipeline.zadd(feedKey, p.finalScore.toString(), p.id);
            });
            pipeline.expire(feedKey, 3600); // 1h TTL
            pipeline.exec().catch(err => console.error("Feed cache warming failed", err));
        }

        return ranked.slice(0, limit);
    }

    /**
     * Home Feed - Hybrid Fan-out Model (Legacy/Compat Wrapper)
     */
    async getHomeFeed(userId: string, limit: number, cursor?: string) {
        return this.getFeed(userId, 'FOLLOWING', limit, cursor);
    }

    /**
     * Ranking Algorithm (Enhanced)
     * Score = Engagement * RecencyDecay
     */
    private calculateRankScore(post: any): number {
        const now = Date.now();
        const publishedAt = post.publishedAt ? new Date(post.publishedAt) : new Date();
        const ageInHours = Math.max(0.1, (now - publishedAt.getTime()) / (1000 * 60 * 60));

        // Engagement Factor
        const engagement = (post.likesCount || 0) + (post.commentsCount || 0) * 2;

        // Recency Decay (T+2)^1.5 Gravity
        const gravity = 1.8;
        return (engagement + 1) / Math.pow(ageInHours + 2, gravity);
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

    /**
     * Global Explore Feed with basic ranking
     */
    async getExploreFeed(limit: number, cursor?: string) {
        const posts = await this.feedRepository.getExploreFeed(limit, cursor);
        return posts.map(post => ({
            ...post,
            rankScore: this.calculateRankScore(post)
        })).sort((a, b) => b.rankScore - a.rankScore);
    }

    /**
     * Hashtag Feed
     */
    async getHashtagFeed(tag: string, limit: number, cursor?: string) {
        return await this.feedRepository.getHashtagFeed(tag, limit, cursor);
    }
}
