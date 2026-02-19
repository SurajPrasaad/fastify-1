export declare class EngagementRepository {
    toggleLike(userId: string, targetId: string, targetType: "POST" | "COMMENT"): Promise<{
        action: string;
    }>;
    upsertReaction(userId: string, targetId: string, targetType: "POST" | "COMMENT", type: string): Promise<{
        action: string;
    }>;
    createRepost(userId: string, postId: string, quoteText?: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        postId: string;
        quoteText: string | null;
    } | undefined>;
    private updateDBCounter;
    private updateDBReactionCounter;
    getCounters(targetId: string): Promise<{
        targetId: string;
        targetType: "POST" | "COMMENT";
        likesCount: number;
        reactionsCount: Record<string, number>;
        commentsCount: number;
        repostsCount: number;
        updatedAt: Date;
    } | undefined>;
}
//# sourceMappingURL=engagement.repository.d.ts.map