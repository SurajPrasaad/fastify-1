import { api } from "@/lib/api-client";

export interface QueuePost {
    id: string;
    content: string;
    codeSnippet?: string;
    language?: string;
    mediaUrls: string[];
    status: string;
    riskScore: number;
    createdAt: string;
    author: {
        id: string;
        username: string;
        name: string;
        avatarUrl?: string;
    };
    reportsCount: number;
}

export interface ModerationAction {
    postId: string;
    action: "APPROVE" | "REJECT" | "REQUEST_REVISION" | "REMOVE" | "RESTORE" | "ESCALATE";
    reason: string;
    internalNote?: string;
}

export interface QueueStats {
    pendingCount: number;
    approvedToday: number;
    rejectedToday: number;
    redisQueueDepth: number;
    avgWaitTimeSeconds: number;
}

export interface ModerationLogEntry {
    id: string;
    action: string;
    previousStatus: string;
    newStatus: string;
    reason: string;
    internalNote?: string;
    createdAt: string;
    moderator: {
        id: string;
        username: string;
        name: string;
    };
}

export interface LockInfo {
    moderatorId: string;
    acquiredAt: number;
    expiresAt: number;
}

export interface LockResult {
    acquired: boolean;
    lockHolder?: string;
    expiresAt?: number;
    error?: string;
}

export const moderationService = {
    // Queue
    async getQueue(limit: number = 20): Promise<QueuePost[]> {
        return api.get(`/moderation/queue?limit=${limit}`);
    },

    async getQueueStats(): Promise<QueueStats> {
        return api.get("/moderation/stats");
    },

    // Actions
    async moderatePost(data: ModerationAction): Promise<any> {
        return api.post("/moderation/moderate", data);
    },

    // Locking
    async lockPost(postId: string): Promise<LockResult> {
        return api.post(`/moderation/lock/${postId}`, {});
    },

    async unlockPost(postId: string): Promise<{ released: boolean }> {
        return api.delete(`/moderation/lock/${postId}`);
    },

    // History
    async getPostHistory(postId: string): Promise<ModerationLogEntry[]> {
        return api.get(`/moderation/history/${postId}`);
    },

    // Reports (user-facing)
    async reportPost(data: { postId: string; reason: string; category: string }): Promise<any> {
        return api.post("/moderation/report", data);
    },

    // Post submission
    async submitForReview(postId: string): Promise<any> {
        return api.post(`/posts/${postId}/submit`, {});
    },

    async resubmitPost(postId: string, data?: any): Promise<any> {
        return api.post(`/posts/${postId}/resubmit`, data || {});
    },
};
