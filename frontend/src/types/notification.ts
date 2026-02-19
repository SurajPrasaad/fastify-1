// ─── Notification Types ─────────────────────────────────────────────────────

export type NotificationType =
    | "LIKE"
    | "COMMENT"
    | "REPLY"
    | "MENTION"
    | "FOLLOW"
    | "SYSTEM";

export interface NotificationSender {
    id: string;
    username: string;
    name: string;
    avatarUrl?: string;
}

export interface NotificationItem {
    id: string;
    type: NotificationType;
    message: string;
    sender?: NotificationSender;
    postId?: string | null;
    commentId?: string | null;
    actionUrl?: string;
    isRead: boolean;
    createdAt: string; // ISO String
    metaData?: {
        count?: number;
        snippet?: string;
        actionUrl?: string;
        image?: string;
    };
}

// ─── API Response Types ─────────────────────────────────────────────────────

export interface NotificationsResponse {
    data: NotificationItem[];
    nextCursor: string | null;
}

export interface UnreadCountResponse {
    count: number;
}
