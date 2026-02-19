"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationItem } from "@/components/notifications/notification-item";
import { useNotifications, useUnreadCount, useMarkRead, useMarkAllRead } from "@/features/notifications/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCheck, BellRing, Loader2, BellOff } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
    isCollapsed?: boolean;
}

export function NotificationBell({ isCollapsed }: NotificationBellProps) {
    const { data: unreadCount = 0 } = useUnreadCount();
    const { data, isLoading } = useNotifications();
    const { mutate: markRead } = useMarkRead();
    const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllRead();

    const notifications = data?.pages.flatMap((page) => page.data) || [];
    const recentNotifications = notifications.slice(0, 8);
    const hasUnread = unreadCount > 0;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("relative h-9 w-9", isCollapsed && "mx-auto")}
                >
                    <Bell className="h-5 w-5" />

                    {/* Animated Badge */}
                    {hasUnread && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1">
                            <span className="text-[10px] font-bold text-destructive-foreground leading-none">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        </span>
                    )}

                    <span className="sr-only">
                        Notifications {hasUnread && `(${unreadCount} unread)`}
                    </span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="start"
                side="right"
                className="w-[400px] p-0 rounded-xl border-border/50 shadow-xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <div>
                        <h3 className="font-semibold text-sm">Notifications</h3>
                        {hasUnread && (
                            <p className="text-xs text-muted-foreground">
                                {unreadCount} unread
                            </p>
                        )}
                    </div>
                    {hasUnread && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => markAllRead()}
                            disabled={isMarkingAll}
                        >
                            <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                            Mark all read
                        </Button>
                    )}
                </div>

                {/* Content */}
                <ScrollArea className="max-h-[420px]">
                    {isLoading ? (
                        <div className="p-4 space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-3.5 w-full" />
                                        <Skeleton className="h-3 w-3/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : recentNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <div className="rounded-full bg-muted/50 p-4 mb-3">
                                <BellOff className="h-6 w-6 text-muted-foreground/50" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">
                                No notifications yet
                            </p>
                            <p className="text-xs text-muted-foreground/60 mt-1">
                                We&apos;ll notify you when something happens
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/30">
                            {recentNotifications.map((item) => (
                                <NotificationItem
                                    key={item.id}
                                    item={item}
                                    onRead={(id) => markRead(id)}
                                />
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="border-t p-2">
                        <Button
                            variant="ghost"
                            className="w-full text-xs h-8 text-primary hover:text-primary"
                            asChild
                        >
                            <Link href="/notifications">View all notifications</Link>
                        </Button>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
