"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import type { NotificationItem as NotificationItemType } from "@/types/notification";

interface NotificationItemProps {
    item: NotificationItemType;
    onRead?: (id: string) => void;
}

const configMap: Record<string, { icon: string; color: string; fill?: boolean }> = {
    LIKE: { icon: "favorite", color: "text-rose-500", fill: true },
    COMMENT: { icon: "chat_bubble", color: "text-primary", fill: true },
    REPLY: { icon: "reply", color: "text-primary", fill: true },
    MENTION: { icon: "alternate_email", color: "text-primary", fill: true },
    FOLLOW: { icon: "person_add", color: "text-primary", fill: true },
    REPOST: { icon: "repeat", color: "text-emerald-500" },
    SYSTEM: { icon: "info", color: "text-slate-500" },
};

export function NotificationItem({ item, onRead }: NotificationItemProps) {
    const router = useRouter();
    const { type, message, sender, isRead, createdAt, actionUrl, metaData } = item;

    const config = configMap[type] || configMap.SYSTEM;

    const handleClick = () => {
        if (!isRead) onRead?.(item.id);
        if (actionUrl) router.push(actionUrl);
    };

    const timeAgo = (() => {
        try {
            return formatDistanceToNow(new Date(createdAt), { addSuffix: false })
                .replace('about ', '')
                .replace(' minutes', 'm')
                .replace(' minute', 'm')
                .replace(' hours', 'h')
                .replace(' hour', 'h')
                .replace(' days', 'd')
                .replace(' day', 'd');
        } catch {
            return "";
        }
    })();

    return (
        <div
            onClick={handleClick}
            className={cn(
                "group relative flex gap-4 p-6 transition-all duration-300 cursor-pointer border-l-4",
                !isRead
                    ? "bg-primary/[0.04] border-primary"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/20 border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            )}
        >
            {/* Type Icon & Unread Indicator */}
            <div className="flex flex-col items-center shrink-0 w-8">
                <span
                    className={cn(
                        "material-symbols-outlined text-2xl mb-1",
                        config.color,
                        config.fill && "fill-icon"
                    )}
                >
                    {config.icon}
                </span>
                {!isRead && (
                    <div className="size-2 bg-primary rounded-full mt-1 animate-pulse shadow-[0_0_8px_rgba(19,91,236,0.6)]" />
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                    <Link
                        href={`/${sender?.username}`}
                        className="shrink-0 group/avatar"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            alt={sender?.name}
                            className="size-10 rounded-full object-cover border-2 border-transparent group-hover/avatar:border-primary/30 transition-all"
                            src={sender?.avatarUrl || `https://api.dicebear.com/7.x/beta/svg?seed=${sender?.id}`}
                        />
                    </Link>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-x-1 min-w-0">
                        <span className="font-bold truncate text-[15px]">{sender?.name}</span>
                        <span className="text-slate-500 text-sm truncate">
                            @{sender?.username} · {timeAgo}
                        </span>
                    </div>
                </div>

                {/* Message Body */}
                <p className="text-[15px] leading-relaxed dark:text-slate-300 mb-3">
                    {renderMessageWithTags(message)}
                </p>

                {/* Optional Metadata / Snippet */}
                {metaData?.snippet && (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-white/50 dark:bg-slate-900/30 transition-colors group-hover:bg-white dark:group-hover:bg-slate-900/50">
                        <p className="text-sm text-slate-500 line-clamp-1 italic">
                            {metaData.snippet}
                        </p>
                    </div>
                )}

                {/* Visual Thumbnail (if any) */}
                {metaData?.image && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video max-w-sm">
                        <img
                            src={metaData.image}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity self-start">
                <button
                    className="size-9 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        // Add more menu logic here
                    }}
                >
                    <span className="material-symbols-outlined text-slate-500">more_horiz</span>
                </button>
            </div>
        </div>
    );
}

function renderMessageWithTags(msg: string) {
    return msg.split(/(@\w+|#\w+)/).map((part, i) => {
        if (part.startsWith('@') || part.startsWith('#')) {
            return (
                <span key={i} className="text-primary font-medium hover:underline cursor-pointer">
                    {part}
                </span>
            );
        }
        return part;
    });
}
