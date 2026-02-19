"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Heart,
    MessageCircle,
    UserPlus,
    AtSign,
    AlertTriangle,
    MoreHorizontal,
    Reply,
    ExternalLink,
} from "lucide-react";
import type { NotificationItem as NotificationItemType } from "@/types/notification";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { useRouter } from "next/navigation";

interface NotificationItemProps {
    item: NotificationItemType;
    onRead?: (id: string) => void;
}

const iconMap: Record<
    string,
    { icon: typeof Heart; color: string; bgColor: string }
> = {
    LIKE: { icon: Heart, color: "text-rose-500", bgColor: "bg-rose-500/10" },
    COMMENT: {
        icon: MessageCircle,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
    },
    REPLY: {
        icon: Reply,
        color: "text-cyan-500",
        bgColor: "bg-cyan-500/10",
    },
    MENTION: {
        icon: AtSign,
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
    },
    FOLLOW: {
        icon: UserPlus,
        color: "text-violet-500",
        bgColor: "bg-violet-500/10",
    },
    SYSTEM: {
        icon: AlertTriangle,
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
    },
};

function getRelativeTime(isoDate: string): string {
    try {
        return formatDistanceToNow(new Date(isoDate), { addSuffix: true });
    } catch {
        return "";
    }
}

export function NotificationItem({ item, onRead }: NotificationItemProps) {
    const router = useRouter();
    const { type, message, sender, isRead, createdAt, actionUrl, metaData } = item;

    const typeConfig = iconMap[type] || iconMap.SYSTEM;
    const PrimaryIcon = typeConfig.icon;

    const notificationLink =
        actionUrl ||
        metaData?.actionUrl ||
        (item.postId ? `/post/${item.postId}` : undefined);

    const initials = sender?.name
        ? sender.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "??";

    const handleClick = () => {
        if (!isRead) {
            onRead?.(item.id);
        }
        if (notificationLink) {
            router.push(notificationLink);
        }
    };

    const content = (
        <div
            onClick={handleClick}
            className={cn(
                "group relative flex items-start gap-3.5 px-4 py-3.5 transition-all duration-200 border-b border-border/50 last:border-0 cursor-pointer",
                !isRead
                    ? "bg-primary/[0.03] hover:bg-primary/[0.06]"
                    : "hover:bg-muted/40"
            )}
        >
            {/* Unread Indicator — animated pulse dot */}
            {!isRead && (
                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
            )}

            {/* Avatar + Type Badge */}
            <div className="relative flex-shrink-0 mt-0.5">
                <Avatar className="h-10 w-10 ring-2 ring-background">
                    <AvatarImage src={sender?.avatarUrl} alt={sender?.name || "User"} />
                    <AvatarFallback className="text-xs font-semibold bg-muted">
                        {initials}
                    </AvatarFallback>
                </Avatar>

                {/* Type Badge */}
                <div
                    className={cn(
                        "absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background",
                        typeConfig.bgColor
                    )}
                >
                    <PrimaryIcon
                        className={cn(
                            "h-2.5 w-2.5",
                            typeConfig.color,
                            type === "LIKE" && "fill-current"
                        )}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm leading-relaxed">
                    {sender && (
                        <Link
                            href={`/${sender.username}`}
                            className="font-semibold hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {sender.name}
                        </Link>
                    )}{" "}
                    <span className="text-muted-foreground">
                        {message.replace(sender?.name || "", "").trim()}
                    </span>
                </p>

                {/* Snippet Preview */}
                {metaData?.snippet && (
                    <div className="mt-1.5 border-l-2 border-muted-foreground/20 pl-3 text-sm text-muted-foreground/80 italic line-clamp-2">
                        &ldquo;{metaData.snippet}&rdquo;
                    </div>
                )}

                {/* Timestamp */}
                <p className="text-xs text-muted-foreground/60 tabular-nums">
                    {getRelativeTime(createdAt)}
                </p>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                {notificationLink && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        asChild
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                        <Link href={notificationLink}>
                            <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                    </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );

    return content;
}
