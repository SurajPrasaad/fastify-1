"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
    CheckCheck,
    Settings,
    SlidersHorizontal,
    BellRing,
    Loader2,
    BellOff,
    RefreshCw,
} from "lucide-react";
import { NotificationItem } from "@/components/notifications/notification-item";
import type { NotificationType } from "@/types/notification";
import {
    useNotifications,
    useMarkAllRead,
    useMarkRead,
    useUnreadCount,
    useNotificationSocket,
} from "@/features/notifications/hooks";

const TABS: { value: string; label: string }[] = [
    { value: "all", label: "All" },
    { value: "LIKE", label: "Likes" },
    { value: "COMMENT", label: "Comments" },
    { value: "REPLY", label: "Replies" },
    { value: "MENTION", label: "Mentions" },
    { value: "FOLLOW", label: "Follows" },
];

export default function NotificationsPage() {
    const [activeTab, setActiveTab] = useState("all");
    const typeFilter =
        activeTab === "all" ? undefined : (activeTab as NotificationType);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        refetch,
        isRefetching,
    } = useNotifications(typeFilter);

    const { data: unreadCount = 0 } = useUnreadCount();
    const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllRead();
    const { mutate: markRead } = useMarkRead();

    // Initialize WebSocket & Push Logic
    const { permission, requestPermission, isConnected } =
        useNotificationSocket();

    const notifications = data?.pages.flatMap((page) => page.data) || [];

    return (
        <div className="container py-6 mx-auto max-w-2xl">
            {/* Sticky Header Area */}
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 pb-4 border-b mb-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Notifications
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {unreadCount > 0
                                ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}.`
                                : "You're all caught up!"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Connection indicator */}
                        <div
                            className="flex items-center gap-1.5"
                            title={isConnected ? "Real-time connected" : "Connecting..."}
                        >
                            <div
                                className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`}
                            />
                        </div>

                        {permission === "default" && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={requestPermission}
                            >
                                <BellRing className="mr-2 h-4 w-4" />
                                Enable Push
                            </Button>
                        )}

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => refetch()}
                            disabled={isRefetching}
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
                            />
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            className="hidden sm:flex"
                            onClick={() => markAllRead()}
                            disabled={isMarkingAll || unreadCount === 0}
                        >
                            <CheckCheck className="mr-2 h-4 w-4" />
                            Mark all as read
                        </Button>
                    </div>
                </div>

                {/* Tab Filters */}
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                >
                    <TabsList className="w-full justify-start overflow-x-auto h-9 bg-muted/50">
                        {TABS.map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="text-xs data-[state=active]:bg-background"
                            >
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>

            {/* Main Content Feed */}
            <div className="space-y-0 min-h-[500px]">
                {isLoading ? (
                    <NotificationSkeleton />
                ) : notifications.length === 0 ? (
                    <EmptyState activeTab={activeTab} />
                ) : (
                    <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
                        {notifications.map((item) => (
                            <NotificationItem
                                key={item.id}
                                item={item}
                                onRead={(id) => markRead(id)}
                            />
                        ))}
                    </div>
                )}

                {/* Load More */}
                {hasNextPage && (
                    <div className="flex justify-center py-6">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full px-6"
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                        >
                            {isFetchingNextPage ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Load more
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────
function NotificationSkeleton() {
    return (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-start gap-3.5 px-4 py-3.5 border-b border-border/30 last:border-0"
                >
                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-full bg-muted animate-pulse rounded" />
                        <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
                        <div className="h-2.5 w-16 bg-muted animate-pulse rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Empty State ────────────────────────────────────────────────────────────
function EmptyState({ activeTab }: { activeTab: string }) {
    const messages: Record<string, string> = {
        all: "No notifications yet",
        LIKE: "No likes yet",
        COMMENT: "No comments yet",
        REPLY: "No replies yet",
        MENTION: "No mentions yet",
        FOLLOW: "No new followers",
    };

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="rounded-full bg-muted/30 p-6 mb-4">
                <BellOff className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-base font-medium text-muted-foreground mb-1">
                {messages[activeTab] || "No notifications"}
            </h3>
            <p className="text-sm text-muted-foreground/60 max-w-xs">
                When someone interacts with your content, you&apos;ll see it here.
            </p>
        </div>
    );
}
