"use client"

import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { useToggleLike } from "@/features/interaction/hooks"

export interface Post {
    id: string
    userId: string
    author: {
        username: string
        displayName: string
        avatarUrl?: string
        isVerified?: boolean
    }
    content: string
    media?: {
        type: "image" | "video"
        url: string
        aspectRatio?: number
    }[]
    stats: {
        likes: number
        comments: number
        shares: number
    }
    createdAt: Date
    isLiked?: boolean
    isBookmarked?: boolean
}

interface PostCardProps {
    post: Post;
    onLikeToggle?: (isLiked: boolean) => void;
}

export function PostCard({ post, onLikeToggle }: PostCardProps) {
    const router = useRouter()
    const { isLiked, count: likesCount, toggleLike } = useToggleLike(post.isLiked, post.stats.likes, onLikeToggle);

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation()
        toggleLike(post.id, "POST")
    }

    const timeAgo = (() => {
        try {
            return post.createdAt instanceof Date && !isNaN(post.createdAt.getTime())
                ? formatDistanceToNow(post.createdAt, { addSuffix: false })
                : "just now";
        } catch (e) {
            return "just now";
        }
    })()

    // Function to highlight hashtags
    const renderContent = (content: string) => {
        return content.split(/(\s+)/).map((part, i) => {
            if (part && part.startsWith('#')) {
                return (
                    <span key={i} className="text-primary hover:underline cursor-pointer transition-colors" onClick={(e) => {
                        e.stopPropagation()
                    }}>
                        {part}
                    </span>
                )
            }
            return part
        })
    }

    return (
        <article
            className="p-4 border-b border-slate-200 dark:border-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-900/40 transition-all cursor-pointer group/post"
            onClick={() => router.push(`/post/${post.id}`)}
        >
            <div className="flex gap-4">
                {/* Avatar */}
                <div className="size-12 rounded-full bg-slate-500 overflow-hidden shrink-0 transition-transform group-hover/post:scale-105">
                    <img
                        className="w-full h-full object-cover"
                        alt={post.author.username}
                        src={post.author.avatarUrl || `https://api.dicebear.com/7.x/beta/svg?seed=${post.userId}`}
                    />
                </div>

                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1 flex-wrap min-w-0">
                            <span className="font-bold hover:underline truncate">{post.author.displayName}</span>
                            {post.author.isVerified && (
                                <span className="material-symbols-outlined text-primary text-[18px] select-none" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    verified
                                </span>
                            )}
                            <span className="text-slate-500 truncate lowercase">@{post.author.username}</span>
                            <span className="text-slate-500 shrink-0">· {timeAgo}</span>
                        </div>
                        <span className="material-symbols-outlined text-slate-500 hover:text-primary transition-colors cursor-pointer p-1 hover:bg-primary/10 rounded-full">
                            more_horiz
                        </span>
                    </div>

                    {/* Content */}
                    <div className="text-[15px] leading-relaxed mb-3 whitespace-pre-wrap dark:text-slate-200">
                        {renderContent(post.content)}
                    </div>

                    {/* Media */}
                    {post.media && post.media.length > 0 && (
                        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-3 aspect-video bg-slate-200 dark:bg-slate-800/30">
                            <img className="w-full h-full object-cover" alt="Post content" src={post.media[0].url} />
                        </div>
                    )}

                    {/* Engagement Bar */}
                    <div className="flex items-center justify-between max-w-md text-slate-500 -ml-2">
                        <EngagementAction
                            icon="chat_bubble"
                            count={post.stats.comments}
                            hoverClass="hover:text-primary hover:bg-primary/10"
                        />
                        <EngagementAction
                            icon="repeat"
                            count={0}
                            hoverClass="hover:text-green-500 hover:bg-green-500/10"
                        />
                        <EngagementAction
                            icon="favorite"
                            count={likesCount}
                            active={isLiked}
                            onClick={handleLike}
                            hoverClass="hover:text-red-500 hover:bg-red-500/10"
                        />
                        <EngagementAction
                            icon="bookmark"
                            count={0}
                            hoverClass="hover:text-primary hover:bg-primary/10"
                        />
                    </div>
                </div>
            </div>
        </article>
    )
}

function EngagementAction({ icon, count, hoverClass, active, onClick }: {
    icon: string,
    count: number,
    hoverClass: string,
    active?: boolean,
    onClick?: (e: React.MouseEvent) => void
}) {
    return (
        <div
            className={cn(
                "flex items-center gap-2 group transition-colors",
                active && icon === "favorite" ? "text-red-500" : "hover:text-inherit",
                hoverClass.split(' ')[0]
            )}
            onClick={onClick}
        >
            <div className={cn("p-2 rounded-full transition-all", hoverClass.split(' ').slice(1).join(' '))}>
                <span
                    className="material-symbols-outlined text-[20px] select-none"
                    style={{ fontVariationSettings: `'FILL' ${active ? 1 : 0}` }}
                >
                    {icon}
                </span>
            </div>
            <span className="text-xs font-medium">{count > 0 ? (count > 999 ? (count / 1000).toFixed(1) + 'k' : count) : ""}</span>
        </div>
    )
}
