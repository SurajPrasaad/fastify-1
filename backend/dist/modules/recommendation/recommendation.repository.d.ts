export declare class RecommendationRepository {
    /**
     * Fetch tags for a specific post.
     */
    getPostTags(postId: string): Promise<string[]>;
    /**
     * Find posts matching any of variable tags.
     * Logic: WHERE tags ?| ARRAY['tag1', 'tag2']
     */
    findByTags(tags: string[], limit: number, excludeIds?: string[]): Promise<{
        id: string;
        userId: string;
        content: string;
        mediaUrls: string[] | null;
        tags: string[] | null;
        status: "DELETED" | "DRAFT" | "PUBLISHED" | "ARCHIVED";
        commentsCount: number;
        likesCount: number;
        createdAt: Date;
        author: {
            username: string;
            name: string;
        };
        metricsScore: number;
    }[]>;
    /**
     * Fallback for Cold Start: Global Trending (Top posts in last 24h or generally popular)
     */
    getGlobalTrending(limit: number, excludeIds?: string[]): Promise<{
        id: string;
        userId: string;
        content: string;
        mediaUrls: string[] | null;
        tags: string[] | null;
        status: "DELETED" | "DRAFT" | "PUBLISHED" | "ARCHIVED";
        commentsCount: number;
        likesCount: number;
        createdAt: Date;
        author: {
            username: string;
            name: string;
        };
        metricsScore: number;
    }[]>;
}
//# sourceMappingURL=recommendation.repository.d.ts.map