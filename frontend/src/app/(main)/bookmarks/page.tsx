"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { useToggleLike, useToggleBookmark } from "@/features/interaction/hooks"
import { toast } from "sonner"

// ─── Types ───────────────────────────────────────────────────────────────────

interface BookmarkedPost {
    id: string
    userId: string
    content: string
    tags: string[]
    mediaUrls: string[]
    likesCount: number
    commentsCount: number
    repostsCount: number
    createdAt: string
    author: {
        username: string
        name: string
        avatarUrl: string | null
    }
    isLiked: boolean
    isBookmarked: boolean
    bookmarkedAt: string
}

interface BookmarksResponse {
    data: BookmarkedPost[]
    meta: { nextCursor: string | null; hasNext: boolean }
}

// ─── API ─────────────────────────────────────────────────────────────────────

async function getBookmarks(cursor?: string, limit = 20): Promise<BookmarksResponse> {
    const params = new URLSearchParams({ limit: limit.toString() })
    if (cursor) params.set("cursor", cursor)
    return api.get(`/interaction/bookmarks?${params}`)
}

// ─── Hook ────────────────────────────────────────────────────────────────────

function useBookmarks() {
    return useInfiniteQuery({
        queryKey: ["bookmarks"],
        queryFn: ({ pageParam }) => getBookmarks(pageParam),
        getNextPageParam: (lastPage) => lastPage.meta?.nextCursor ?? undefined,
        initialPageParam: undefined as string | undefined,
        staleTime: 60_000,
    })
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function BookmarksPage() {
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useBookmarks()
    const queryClient = useQueryClient()
    const loaderRef = React.useRef<HTMLDivElement>(null)

    // Infinite scroll
    React.useEffect(() => {
        if (!loaderRef.current || !hasNextPage) return
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage()
                }
            },
            { threshold: 0.5 }
        )
        observer.observe(loaderRef.current)
        return () => observer.disconnect()
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    const allPosts = data?.pages.flatMap((p) => p.data) ?? []

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
                <div className="px-4 py-4 flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-2xl fill-icon">bookmark</span>
                    <div>
                        <h1 className="text-xl font-bold font-display">Bookmarks</h1>
                        <p className="text-xs text-muted-foreground">
                            {allPosts.length > 0
                                ? `${allPosts.length} saved post${allPosts.length !== 1 ? "s" : ""}`
                                : "Your saved posts will appear here"
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex flex-col gap-0">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <BookmarkSkeleton key={i} />
                    ))}
                </div>
            )}

            {/* Error State */}
            {isError && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <span className="material-symbols-outlined text-5xl text-red-400">error</span>
                    <p className="text-muted-foreground">Failed to load bookmarks</p>
                    <button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ["bookmarks"] })}
                        className="px-4 py-2 bg-primary text-white rounded-full text-sm font-bold hover:opacity-90 transition-opacity"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !isError && allPosts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 gap-5">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse" />
                        <div className="relative size-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-primary/60">bookmark_border</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-bold font-display mb-1">No bookmarks yet</h3>
                        <p className="text-sm text-muted-foreground max-w-[280px]">
                            When you bookmark a post, it will show up here for easy access later.
                        </p>
                    </div>
                </div>
            )}

            {/* Posts */}
            {allPosts.length > 0 && (
                <div className="flex flex-col">
                    {allPosts.map((post) => (
                        <BookmarkCard
                            key={post.id}
                            post={post}
                            onRemove={() => {
                                queryClient.invalidateQueries({ queryKey: ["bookmarks"] })
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Infinite scroll loader */}
            {hasNextPage && (
                <div ref={loaderRef} className="flex justify-center py-6">
                    {isFetchingNextPage && (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <div className="size-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            Loading more...
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ─── Bookmark Card ───────────────────────────────────────────────────────────

function BookmarkCard({ post, onRemove }: { post: BookmarkedPost; onRemove: () => void }) {
    const router = useRouter()
    const { isLiked, toggleLike, isPending: likePending } = useToggleLike(post.isLiked, post.likesCount)
    const { isBookmarked, toggleBookmark, isPending: bookmarkPending } = useToggleBookmark(post.isBookmarked)
    const [localLikesCount, setLocalLikesCount] = React.useState(post.likesCount)

    const handleLike = () => {
        if (likePending) return
        setLocalLikesCount((c) => (isLiked ? c - 1 : c + 1))
        toggleLike(post.id, "POST")
    }

    const handleBookmarkRemove = async () => {
        if (bookmarkPending) return
        toggleBookmark(post.id)
        toast.success("Removed from bookmarks")
        onRemove()
    }

    const hashtags = post.tags || []

    return (
        <article
            className="px-4 py-4 border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer group"
            onClick={() => router.push(`/${post.author.username}`)}
        >
            <div className="flex gap-3">
                {/* Avatar */}
                <div
                    className="size-11 rounded-full overflow-hidden bg-muted shrink-0 ring-2 ring-transparent group-hover:ring-primary/20 transition-all"
                    onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/${post.author.username}`)
                    }}
                >
                    {post.author.avatarUrl ? (
                        <img src={post.author.avatarUrl} alt={post.author.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-sm">
                            {post.author.name?.[0]?.toUpperCase() || "?"}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 text-sm overflow-hidden">
                            <span className="font-bold truncate hover:underline">{post.author.name}</span>
                            <span className="text-muted-foreground truncate">@{post.author.username}</span>
                            <span className="text-muted-foreground shrink-0">·</span>
                            <span className="text-muted-foreground text-xs shrink-0">
                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: false })}
                            </span>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleBookmarkRemove()
                            }}
                            className="p-1.5 rounded-full hover:bg-amber-500/10 text-amber-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove bookmark"
                        >
                            <span className="material-symbols-outlined text-xl fill-icon">bookmark</span>
                        </button>
                    </div>

                    {/* Post Content */}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words mb-2">
                        {post.content}
                    </p>

                    {/* Hashtags */}
                    {hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {hashtags.map((tag) => (
                                <span
                                    key={tag}
                                    className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        router.push(`/explore?q=%23${tag}`)
                                    }}
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Media */}
                    {post.mediaUrls && post.mediaUrls.length > 0 && (
                        <div className={cn(
                            "rounded-xl overflow-hidden border border-border/50 mb-3 grid gap-0.5",
                            post.mediaUrls.length === 1 && "grid-cols-1",
                            post.mediaUrls.length === 2 && "grid-cols-2",
                            post.mediaUrls.length >= 3 && "grid-cols-2 grid-rows-2",
                        )}>
                            {post.mediaUrls.slice(0, 4).map((url, i) => (
                                <img
                                    key={i}
                                    src={url}
                                    alt=""
                                    className="w-full h-40 object-cover"
                                    loading="lazy"
                                />
                            ))}
                        </div>
                    )}

                    {/* Engagement Bar */}
                    <div className="flex items-center gap-6 mt-1" onClick={(e) => e.stopPropagation()}>
                        <EngagementButton
                            icon="chat_bubble_outline"
                            count={post.commentsCount}
                            hoverColor="text-sky-500"
                            hoverBg="hover:bg-sky-500/10"
                        />
                        <EngagementButton
                            icon="repeat"
                            count={post.repostsCount}
                            hoverColor="text-emerald-500"
                            hoverBg="hover:bg-emerald-500/10"
                        />
                        <EngagementButton
                            icon={isLiked ? "favorite" : "favorite_border"}
                            count={localLikesCount}
                            active={isLiked}
                            activeColor="text-rose-500"
                            hoverColor="text-rose-500"
                            hoverBg="hover:bg-rose-500/10"
                            onClick={handleLike}
                            filled={isLiked}
                        />
                    </div>
                </div>
            </div>
        </article>
    )
}

// ─── Engagement Button ───────────────────────────────────────────────────────

function EngagementButton({
    icon,
    count,
    active,
    activeColor,
    hoverColor = "text-primary",
    hoverBg = "hover:bg-primary/10",
    onClick,
    filled,
}: {
    icon: string
    count?: number
    active?: boolean
    activeColor?: string
    hoverColor?: string
    hoverBg?: string
    onClick?: () => void
    filled?: boolean
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-1 group/btn transition-colors",
                active ? activeColor : "text-muted-foreground",
                `hover:${hoverColor}`
            )}
        >
            <div className={cn("p-1.5 rounded-full transition-colors", hoverBg)}>
                <span className={cn(
                    "material-symbols-outlined text-[18px]",
                    filled && "fill-icon"
                )}>
                    {icon}
                </span>
            </div>
            {count !== undefined && count > 0 && (
                <span className="text-xs font-medium">
                    {count > 999 ? `${(count / 1000).toFixed(1)}k` : count}
                </span>
            )}
        </button>
    )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function BookmarkSkeleton() {
    return (
        <div className="px-4 py-4 border-b border-border/50 animate-pulse">
            <div className="flex gap-3">
                <div className="size-11 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="h-3.5 w-24 bg-muted rounded" />
                        <div className="h-3 w-16 bg-muted rounded" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-3 w-full bg-muted rounded" />
                        <div className="h-3 w-4/5 bg-muted rounded" />
                        <div className="h-3 w-3/5 bg-muted rounded" />
                    </div>
                    <div className="flex gap-6 pt-1">
                        <div className="h-3 w-12 bg-muted rounded" />
                        <div className="h-3 w-12 bg-muted rounded" />
                        <div className="h-3 w-12 bg-muted rounded" />
                    </div>
                </div>
            </div>
        </div>
    )
}
