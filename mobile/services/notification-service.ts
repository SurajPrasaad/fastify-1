import { api } from "./api-client";

export type NotificationType = 'LIKE' | 'COMMENT' | 'REPLY' | 'MENTION' | 'FOLLOW' | 'REPOST' | 'SYSTEM' | 'VERIFIED';

export interface NotificationItem {
    id: string;
    type: NotificationType;
    message: string;
    sender?: {
        id: string;
        username: string;
        name: string;
        avatarUrl?: string;
    };
    postId?: string;
    commentId?: string;
    isRead: boolean;
    createdAt: string;
    metaData?: any;
}

export interface NotificationsResponse {
    data: NotificationItem[];
    nextCursor: string | null;
}

export const NotificationService = {
    getNotifications: async (params: { cursor?: string; type?: NotificationType }) => {
        const query = new URLSearchParams();
        query.set("limit", "20");
        if (params.cursor) query.set("cursor", params.cursor);
        if (params.type) query.set("type", params.type);
        return api.get<NotificationsResponse>(`/notifications?${query.toString()}`);
    },

    getUnreadCount: async () => {
        return api.get<{ count: number }>("/notifications/unread-count");
    },

    markRead: async (id: string) => {
        return api.patch<{ success: boolean }>(`/notifications/${id}/read`);
    },

    markAllRead: async () => {
        return api.post<{ success: boolean }>("/notifications/read-all");
    },

    registerDevice: async (token: string, platform: 'IOS' | 'ANDROID') => {
        return api.post("/notifications/register-device", { token, platform });
    }
};
