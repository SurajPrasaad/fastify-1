"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { useToggleLike, useToggleBookmark } from "@/features/interaction/hooks"
import { useTrackExploreInteraction } from "@/features/explore/hooks"
import type { ExplorePost } from "@/features/explore/types"

interface ExplorePostCardProps {
    post: ExplorePost
    index?: number
}

export function ExplorePostCard({ post, index = 0 }: ExplorePostCardProps) {
    const router = useRouter()
    const { isLiked, count: likesCount, toggleLike } = useToggleLike(post.isLiked, post.likesCount)
    const { isBookmarked, toggleBookmark } = useToggleBookmark(post.isBookmarked)
    const { mutate: trackInteraction } = useTrackExploreInteraction()

    // Track view when post enters viewport
    const cardRef = React.useRef<HTMLElement>(null)
    const hasTracked = React.useRef(false)

    React.useEffect(() => {
        if (!cardRef.current || hasTracked.current) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    const startTime = Date.now()
                    const timeout = setTimeout(() => {
                        trackInteraction({ postId: post.id, action: "VIEW", duration: 5 })
                        hasTracked.current = true
                    }, 5000)

                    // Clean up if scrolled away before 5s
                    const cleanupObserver = new IntersectionObserver(([e]) => {
                        if (!e.isIntersecting) {
                            clearTimeout(timeout)
                            const elapsed = Math.round((Date.now() - startTime) / 1000)
                            if (elapsed >= 3) {
                                trackInteraction({ postId: post.id, action: "VIEW", duration: elapsed })
                                hasTracked.current = true
                            }
                            cleanupObserver.disconnect()
                        }
                    }, { threshold: 0 })

                    cleanupObserver.observe(cardRef.current!)
                    observer.disconnect()
                }
            },
            { threshold: 0.5 }
        )

        observer.observe(cardRef.current)
        return () => observer.disconnect()
    }, [post.id, trackInteraction])

    const timeAgo = React.useMemo(() => {
        try {
            const date = new Date(post.createdAt)
            return !isNaN(date.getTime()) ? formatDistanceToNow(date, { addSuffix: false }) : "just now"
        } catch { return "just now" }
    }, [post.createdAt])

    const renderContent = (content: string) => {
        return content.split(/(\s+)/).map((part, i) => {
            if (part?.startsWith("#")) {
                return (
                    <span
                        key={i}
                        className="text-primary hover:underline cursor-pointer transition-colors font-medium"
                        onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/hashtag/${part.slice(1)}`)
                        }}
                    >
                        {part}
                    </span>
                )
            }
            if (part?.startsWith("@")) {
                return (
                    <span
                        key={i}
                        className="text-primary hover:underline cursor-pointer transition-colors"
                        onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/${part.slice(1)}`)
                        }}
                    >
                        {part}
                    </span>
                )
            }
            return part
        })
    }

    const sourceTag = post.source === "PERSONALIZED"
        ? "Based on your interests"
        : post.source === "TRENDING"
            ? "Trending"
            : post.source === "SERENDIPITY"
                ? "Discover something new"
                : null

    return (
        <article
            ref={cardRef}
            className={cn(
                "p-5 border-b border-slate-200/60 dark:border-slate-800/40 transition-all duration-200 cursor-pointer group/post",
                "hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => router.push(`/post/${post.id}`)}
        >
            {/* Relevance Hint */}
            {sourceTag && (
                <div className="flex items-center gap-1.5 mb-3 ml-14">
                    <span className="material-symbols-outlined text-[14px] text-slate-400">
                        {post.source === "PERSONALIZED" ? "auto_awesome" : post.source === "TRENDING" ? "trending_up" : "explore"}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{sourceTag}</span>
                </div>
            )}

            <div className="flex gap-3.5">
                {/* Avatar */}
                <div
                    className="size-11 rounded-full bg-slate-300 dark:bg-slate-700 overflow-hidden shrink-0 ring-2 ring-transparent group-hover/post:ring-primary/20 transition-all duration-300"
                    onClick={(e) => { e.stopPropagation(); router.push(`/${post.author.username}`) }}
                >
                    <img
                        className="w-full h-full object-cover"
                        alt={post.author.username}
                        src={post.author.avatarUrl || `https://api.dicebear.com/7.x/beta/svg?seed=${post.userId}`}
                        loading="lazy"
                    />
                </div>

                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                            className="font-bold text-[15px] hover:underline truncate cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); router.push(`/${post.author.username}`) }}
                        >
                            {post.author.name}
                        </span>
                        <span className="text-slate-500 text-sm truncate">@{post.author.username}</span>
                        <span className="text-slate-400 text-sm shrink-0">· {timeAgo}</span>
                    </div>

                    {/* Content */}
                    {post.content && (
                        <div className="text-[15px] leading-relaxed mb-3 whitespace-pre-wrap dark:text-slate-200">
                            {renderContent(post.content)}
                        </div>
                    )}

                    {/* Media Preview */}
                    {post.mediaUrls && post.mediaUrls.length > 0 && (
                        <div className={cn(
                            "rounded-2xl overflow-hidden mb-3 border border-slate-200/60 dark:border-slate-800/40",
                            post.mediaUrls.length === 1 ? "max-h-[400px]" : "grid grid-cols-2 gap-0.5 max-h-[300px]"
                        )}>
                            {post.mediaUrls.slice(0, 4).map((url, i) => (
                                <div key={i} className="relative overflow-hidden bg-slate-200 dark:bg-slate-800">
                                    <img
                                        src={url}
                                        alt=""
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                        loading="lazy"
                                    />
                                    {i === 3 && post.mediaUrls.length > 4 && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <span className="text-white text-xl font-bold">+{post.mediaUrls.length - 4}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {post.tags.slice(0, 3).map(tag => (
                                <span
                                    key={tag}
                                    className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/8 text-primary/80 hover:bg-primary/15 transition-colors cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); router.push(`/hashtag/${tag}`) }}
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Engagement Bar */}
                    <div className="flex items-center justify-between mt-1 text-slate-500 max-w-md -ml-2">
                        <EngagementBtn
                            icon="chat_bubble"
                            count={post.commentsCount}
                            hoverColor="text-primary"
                            hoverBg="bg-primary/10"
                        />
                        <EngagementBtn
                            icon="repeat"
                            count={post.repostsCount}
                            hoverColor="text-emerald-500"
                            hoverBg="bg-emerald-500/10"
                        />
                        <EngagementBtn
                            icon="favorite"
                            count={likesCount}
                            active={isLiked}
                            activeColor="text-red-500"
                            hoverColor="text-red-500"
                            hoverBg="bg-red-500/10"
                            onClick={(e) => {
                                e.stopPropagation()
                                toggleLike(post.id, "POST")
                            }}
                        />
                        <EngagementBtn
                            icon="bookmark"
                            count={0}
                            active={isBookmarked}
                            activeColor="text-primary"
                            hoverColor="text-primary"
                            hoverBg="bg-primary/10"
                            onClick={(e) => {
                                e.stopPropagation()
                                toggleBookmark(post.id)
                            }}
                        />
                    </div>
                </div>
            </div>
        </article>
    )
}

function EngagementBtn({
    icon, count, active, activeColor, hoverColor, hoverBg, onClick
}: {
    icon: string
    count: number
    active?: boolean
    activeColor?: string
    hoverColor?: string
    hoverBg?: string
    onClick?: (e: React.MouseEvent) => void
}) {
    return (
        <div
            className={cn(
                "flex items-center gap-1.5 group/btn cursor-pointer transition-colors",
                active && activeColor
            )}
            onClick={onClick}
        >
            <div className={cn(
                "p-2 rounded-full transition-all duration-200",
                `group-hover/btn:${hoverBg} group-hover/btn:${hoverColor}`
            )}>
                <span
                    className={cn(
                        "material-symbols-outlined text-[19px] select-none transition-all",
                        `group-hover/btn:${hoverColor}`,
                        active && "scale-110"
                    )}
                    style={{ fontVariationSettings: `'FILL' ${active ? 1 : 0}` }}
                >
                    {icon}
                </span>
            </div>
            {count > 0 && (
                <span className={cn("text-xs font-medium transition-colors", `group-hover/btn:${hoverColor}`)}>
                    {count > 999 ? (count / 1000).toFixed(1) + "k" : count}
                </span>
            )}
        </div>
    )
}
