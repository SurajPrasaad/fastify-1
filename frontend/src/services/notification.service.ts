import { api } from "@/lib/api-client";
import type { NotificationsResponse, UnreadCountResponse, NotificationType } from "@/types/notification";

export const NotificationService = {
    /**
     * Paginated notifications with optional type filter
     */
    getNotifications: async ({
        pageParam,
        type,
    }: {
        pageParam?: string;
        type?: NotificationType;
    }) => {
        const params = new URLSearchParams();
        params.set("limit", "20");
        if (pageParam) params.set("cursor", pageParam);
        if (type) params.set("type", type);
        return api.get<NotificationsResponse>(`/notifications?${params.toString()}`);
    },

    /**
     * Get unread notification count
     */
    getUnreadCount: async () => {
        return api.get<UnreadCountResponse>("/notifications/unread-count");
    },

    /**
     * Mark a single notification as read (optimistic)
     */
    markRead: async (id: string) => {
        return api.patch<{ success: boolean }>(`/notifications/${id}/read`);
    },

    /**
     * Mark all notifications as read
     */
    markAllRead: async () => {
        return api.post<{ success: boolean }>("/notifications/read-all");
    },

    /**
     * Register FCM device token for push notifications
     */
    registerDevice: async (token: string, platform: "WEB" | "IOS" | "ANDROID") => {
        return api.post<{ message: string }>("/notifications/register-device", {
            token,
            platform,
        });
    },
};
