"use client";

import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { NotificationService } from "@/services/notification.service";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import type { NotificationItem, NotificationType, NotificationsResponse } from "@/types/notification";
import { getFcmToken } from "@/lib/firebase";
import { api } from "@/lib/api-client";
import { io } from "socket.io-client";

// ─── Query Keys ─────────────────────────────────────────────────────────────
export const notificationKeys = {
    all: ["notifications"] as const,
    list: (userId: string, type?: NotificationType) =>
        [...notificationKeys.all, userId, type] as const,
    unreadCount: (userId: string) =>
        [...notificationKeys.all, "unread", userId] as const,
};

// ─── Adapter: Transform backend response to frontend type ───────────────────
const adaptNotification = (n: any): NotificationItem => {
    // The backend now returns `type` directly (LIKE, COMMENT, REPLY, MENTION, FOLLOW)
    // Fallback logic for legacy responses
    let type: NotificationType = n.type || "SYSTEM";
    if (!n.type && n.entityType === "POST") type = "LIKE";
    if (!n.type && n.entityType === "FOLLOW") type = "FOLLOW";

    return {
        id: n.id,
        type,
        message: n.message,
        sender: n.sender
            ? {
                id: n.sender.id,
                username: n.sender.username || "",
                name: n.sender.name || "Unknown",
                avatarUrl: n.sender.avatarUrl,
            }
            : undefined,
        postId: n.postId || n.metaData?.postId || null,
        commentId: n.commentId || null,
        actionUrl: n.metaData?.actionUrl || n.actionUrl,
        isRead: n.isRead,
        createdAt: n.createdAt,
        metaData: n.metaData,
    };
};

// ─── useNotifications: Paginated infinite list ──────────────────────────────
export const useNotifications = (typeFilter?: NotificationType) => {
    const { user } = useAuth();

    return useInfiniteQuery({
        queryKey: notificationKeys.list(user?.id || "", typeFilter),
        queryFn: async ({ pageParam }) => {
            const response = await NotificationService.getNotifications({
                pageParam,
                type: typeFilter,
            });
            return {
                data: response.data.map(adaptNotification),
                nextCursor: response.nextCursor,
            };
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        initialPageParam: undefined as string | undefined,
        enabled: !!user,
        staleTime: 30_000, // 30s stale time for notifications
        refetchOnWindowFocus: true,
    });
};

// ─── useUnreadCount: Badge counter ──────────────────────────────────────────
export const useUnreadCount = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: notificationKeys.unreadCount(user?.id || ""),
        queryFn: async () => {
            const response = await NotificationService.getUnreadCount();
            return response.count;
        },
        enabled: !!user,
        staleTime: 10_000, // 10s stale time
        refetchInterval: 60_000, // Polling every 60s as fallback
        refetchOnWindowFocus: true,
    });
};

// ─── useMarkRead: Optimistic single mark ────────────────────────────────────
export const useMarkRead = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: NotificationService.markRead,
        onMutate: async (id: string) => {
            // Cancel ongoing refetches
            await queryClient.cancelQueries({
                queryKey: notificationKeys.all,
            });

            // Snapshot for rollback
            const previousData = queryClient.getQueriesData({
                queryKey: notificationKeys.all,
            });

            // Optimistic update: mark this notification as read
            queryClient.setQueriesData(
                { queryKey: notificationKeys.all },
                (old: any) => {
                    if (!old?.pages) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page: any) => ({
                            ...page,
                            data: page.data.map((n: NotificationItem) =>
                                n.id === id ? { ...n, isRead: true } : n
                            ),
                        })),
                    };
                }
            );

            // Optimistic: decrement unread count
            queryClient.setQueryData(
                notificationKeys.unreadCount(user?.id || ""),
                (old: number | undefined) => Math.max((old || 0) - 1, 0)
            );

            return { previousData };
        },
        onError: (_err, _id, context) => {
            // Rollback on error
            if (context?.previousData) {
                for (const [queryKey, data] of context.previousData) {
                    queryClient.setQueryData(queryKey, data);
                }
            }
        },
    });
};

// ─── useMarkAllRead ─────────────────────────────────────────────────────────
export const useMarkAllRead = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: NotificationService.markAllRead,
        onMutate: async () => {
            await queryClient.cancelQueries({
                queryKey: notificationKeys.all,
            });

            const previousData = queryClient.getQueriesData({
                queryKey: notificationKeys.all,
            });

            // Optimistic: mark all as read
            queryClient.setQueriesData(
                { queryKey: notificationKeys.all },
                (old: any) => {
                    if (!old?.pages) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page: any) => ({
                            ...page,
                            data: page.data.map((n: NotificationItem) => ({
                                ...n,
                                isRead: true,
                            })),
                        })),
                    };
                }
            );

            // Optimistic: set unread count to 0
            queryClient.setQueryData(
                notificationKeys.unreadCount(user?.id || ""),
                0
            );

            return { previousData };
        },
        onSuccess: () => {
            toast.success("All notifications marked as read");
        },
        onError: (_err, _vars, context) => {
            if (context?.previousData) {
                for (const [queryKey, data] of context.previousData) {
                    queryClient.setQueryData(queryKey, data);
                }
            }
            toast.error("Failed to mark notifications as read");
        },
    });
};

// ─── useNotificationSocket: Real-time Socket.IO + Push ──────────────────────
export const useNotificationSocket = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [permission, setPermission] = useState<NotificationPermission>("default");
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<any>(null);

    // Get notification permission status
    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            setPermission(Notification.permission);
        }
    }, []);

    // ─── Request Push Permission + Register FCM Token ───────────────────────
    const requestPermission = useCallback(async () => {
        try {
            const token = await getFcmToken();
            if (token) {
                await NotificationService.registerDevice(token, "WEB");
                setPermission("granted");
                toast.success("Push notifications enabled!");
            } else {
                setPermission("denied");
                toast.error("Push notification permission denied");
            }
        } catch (error) {
            console.error("Error enabling push notifications:", error);
            toast.error("Failed to enable push notifications");
        }
    }, []);

    // ─── Deduplicate incoming notifications ─────────────────────────────────
    const seenIds = useRef(new Set<string>());

    const handleNotificationMessage = useCallback(
        (adapted: NotificationItem) => {
            // Deduplication: skip if we've already seen this notification
            if (seenIds.current.has(adapted.id)) return;
            seenIds.current.add(adapted.id);

            // Keep the set from growing unbounded
            if (seenIds.current.size > 200) {
                const entries = Array.from(seenIds.current);
                seenIds.current = new Set(entries.slice(-100));
            }

            // Prepend to notification list cache
            queryClient.setQueriesData(
                { queryKey: notificationKeys.all },
                (old: any) => {
                    if (!old?.pages) {
                        return {
                            pages: [{ data: [adapted], nextCursor: null }],
                            pageParams: [undefined],
                        };
                    }

                    // Avoid duplicates in existing cache
                    const existingIds = new Set(
                        old.pages.flatMap((page: any) =>
                            page.data.map((n: NotificationItem) => n.id)
                        )
                    );
                    if (existingIds.has(adapted.id)) return old;

                    const newPages = [...old.pages];
                    newPages[0] = {
                        ...newPages[0],
                        data: [adapted, ...newPages[0].data],
                    };

                    return { ...old, pages: newPages };
                }
            );

            // Increment unread count
            queryClient.setQueryData(
                notificationKeys.unreadCount(user?.id || ""),
                (old: number | undefined) => (old || 0) + 1
            );

            // Show toast notification
            const icon = {
                LIKE: "❤️",
                COMMENT: "💬",
                REPLY: "↩️",
                MENTION: "📢",
                FOLLOW: "👤",
                SYSTEM: "🔔",
            }[adapted.type] || "🔔";

            toast(
                `${icon} ${adapted.message}`,
                {
                    action: adapted.actionUrl
                        ? {
                            label: "View",
                            onClick: () => {
                                window.location.href = adapted.actionUrl!;
                            },
                        }
                        : undefined,
                }
            );
        },
        [queryClient, user?.id]
    );

    // ─── Socket.IO Connection ───────────────────────────────────────────
    const connect = useCallback(() => {
        if (!user) return;

        const token = api.getToken();
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';


        try {
            const s = io(`${wsUrl}/notifications`, {
                path: '/chat/socket.io',
                query: { token },
                transports: ['websocket'],
                reconnectionAttempts: 5,
            });

            s.on("connect", () => {
                console.log("🔔 Notification Socket.IO connected");
                setIsConnected(true);
            });

            s.on("notification:new", (payload: any) => {
                const adapted = adaptNotification(payload);
                handleNotificationMessage(adapted);
            });

            s.on("connection:established", (data: any) => {
                console.log("Connection established with Socket.IO server", data);
            });

            s.on("disconnect", () => {
                console.log("� Notification Socket.IO disconnected");
                setIsConnected(false);
            });

            s.on("connect_error", (error: any) => {
                console.error("Socket.IO connection error:", error);
            });

            socketRef.current = s;
        } catch (err) {
            console.error("Failed to create Socket.IO connection:", err);
        }
    }, [user, handleNotificationMessage]);

    useEffect(() => {
        connect();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [connect]);

    return {
        socket: socketRef.current,
        requestPermission,
        permission,
        isConnected,
    };
};
