"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, BellOff, RefreshCw } from "lucide-react";
import { NotificationItem } from "@/components/notifications/notification-item";
import type { NotificationType } from "@/types/notification";
import { cn } from "@/lib/utils";
import {
    useNotifications,
    useMarkAllRead,
    useMarkRead,
    useUnreadCount,
    useNotificationSocket,
} from "@/features/notifications/hooks";

const TABS = [
    { value: "all", label: "All" },
    { value: "VERIFIED", label: "Verified" },
    { value: "MENTION", label: "Mentions" },
    { value: "FOLLOW", label: "Follows" },
    { value: "REPOST", label: "Reposts" },
];

export default function NotificationsPage() {
    const [activeTab, setActiveTab] = useState("all");
    const typeFilter = activeTab === "all" ? undefined : (activeTab as NotificationType);

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

    const { isConnected } = useNotificationSocket();

    const notifications = data?.pages.flatMap((page) => page.data) || [];

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
            {/* Sticky Header */}
            <header className="sticky top-0 z-30 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-all">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold tracking-tight">Notifications</h1>
                        {isConnected && (
                            <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" title="Connected" />
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            disabled={isRefetching}
                            onClick={() => refetch()}
                            className="size-9 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <RefreshCw className={cn("size-4 text-slate-500", isRefetching && "animate-spin")} />
                        </button>
                        <button
                            onClick={() => markAllRead()}
                            disabled={isMarkingAll || unreadCount === 0}
                            className="text-primary text-sm font-bold hover:bg-primary/10 px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                        >
                            Mark all as read
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center px-2">
                    {TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={cn(
                                "flex-1 py-4 text-sm font-medium transition-all relative",
                                activeTab === tab.value
                                    ? "text-primary"
                                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                            )}
                        >
                            {tab.label}
                            {activeTab === tab.value && (
                                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>
            </header>

            {/* Notification Feed */}
            <main className="flex-1 divide-y divide-slate-200 dark:divide-slate-800">
                {isLoading ? (
                    <NotificationSkeleton />
                ) : notifications.length === 0 ? (
                    <EmptyState activeTab={activeTab} />
                ) : (
                    <>
                        {notifications.map((item) => (
                            <NotificationItem
                                key={item.id}
                                item={item}
                                onRead={(id) => markRead(id)}
                            />
                        ))}

                        {/* Pagination */}
                        {hasNextPage && (
                            <div className="p-8 flex justify-center">
                                <Button
                                    variant="ghost"
                                    onClick={() => fetchNextPage()}
                                    disabled={isFetchingNextPage}
                                    className="text-primary font-bold hover:bg-primary/10 rounded-xl px-8"
                                >
                                    {isFetchingNextPage ? (
                                        <Loader2 className="size-4 animate-spin mr-2" />
                                    ) : null}
                                    Load more notifications
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

function NotificationSkeleton() {
    return (
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="p-6 flex gap-4 animate-pulse">
                    <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                    <div className="flex-1 space-y-3">
                        <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-md" />
                        <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState({ activeTab }: { activeTab: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="size-20 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-6">
                <BellOff className="size-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">No notifications yet</h3>
            <p className="text-slate-500 max-w-sm">
                When people interact with you or your posts, you'll see them here.
            </p>
        </div>
    );
}
