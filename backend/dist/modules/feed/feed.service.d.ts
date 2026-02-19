import { FeedRepository } from "./feed.repository.js";
export declare class FeedService {
    private feedRepository;
    constructor(feedRepository: FeedRepository);
    private getUserFeedKey;
    /**
     * Home Feed - Hybrid Fan-out Model
     * Normal Users: Fan-out on Write (IDs pushed to Redis ZSET)
     * Celebrities: Fan-out on Read (Merged from DB/Cache at request time)
     */
    getHomeFeed(userId: string, limit: number, cursor?: string): Promise<{
        rankScore: number;
        id: string;
        userId: string;
        content: string;
        mediaUrls: string[] | null;
        tags: string[] | null;
        status: "DELETED" | "DRAFT" | "PUBLISHED" | "ARCHIVED";
        commentsCount: number;
        likesCount: number;
        publishedAt: Date | null;
        author: {
            username: string;
            name: string;
        };
    }[]>;
    /**
     * Ranking Algorithm (Pseudo-code implementation)
     * Score = (EngagementVelocity * 0.4) + (Recency * 0.4) + (Affinity * 0.2)
     */
    private calculateRankScore;
    /**
     * Fan-out Worker Logic (Triggered by post.created event)
     */
    handlePostCreated(postId: string, creatorId: string): Promise<void>;
    /**
     * Smart Rebalancing - Update post rank across active feeds
     */
    rebalancePost(postId: string): Promise<void>;
}
//# sourceMappingURL=feed.service.d.ts.map