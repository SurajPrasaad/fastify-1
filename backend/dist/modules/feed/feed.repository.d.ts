export declare class FeedRepository {
    findByIds(ids: string[]): Promise<{
        id: string;
        userId: string;
        content: string;
        mediaUrls: string[] | null;
        tags: string[] | null;
        status: "DELETED" | "DRAFT" | "PUBLISHED" | "ARCHIVED";
        commentsCount: number;
        likesCount: number;
        createdAt: Date;
        publishedAt: Date | null;
        author: {
            username: string;
            name: string;
        };
    }[]>;
    getCelebrityPosts(userId: string, limit: number, cursor?: string): Promise<{
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
    getFollowerIds(userId: string, limit?: number, offset?: number): Promise<{
        followerId: string;
    }[]>;
    isCelebrity(userId: string): Promise<boolean>;
    getAffinityScores(userId: string): Promise<{
        targetUserId: string;
        score: number;
    }[]>;
    getHomeFeedFallback(userId: string, limit: number, cursor?: string): Promise<{
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
}
//# sourceMappingURL=feed.repository.d.ts.map