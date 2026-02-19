import { EngagementRepository } from "./engagement.repository.js";
export declare class EngagementService {
    private repository;
    constructor(repository: EngagementRepository);
    private getStatKey;
    toggleLike(userId: string, targetId: string, targetType: "POST" | "COMMENT"): Promise<{
        action: string;
    }>;
    react(userId: string, targetId: string, targetType: "POST" | "COMMENT", type: string): Promise<{
        action: string;
    }>;
    repost(userId: string, postId: string, quoteText?: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        postId: string;
        quoteText: string | null;
    } | undefined>;
    getEngagementStats(targetId: string): Promise<{
        likes: number;
        comments: number;
        reposts: number;
        reactions: Record<string, number>;
    }>;
    private formatStats;
    private syncCountersFromDB;
}
//# sourceMappingURL=engagement.service.d.ts.map