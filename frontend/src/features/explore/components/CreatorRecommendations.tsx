"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useExploreCreators } from "@/features/explore/hooks"
import { useToggleFollow } from "@/features/follow/hooks"
import { useRouter } from "next/navigation"

export function CreatorRecommendations() {
    const router = useRouter()
    const { data, isLoading } = useExploreCreators()
    const { mutate: toggleFollow, isPending } = useToggleFollow()
    const [followedIds, setFollowedIds] = React.useState<Set<string>>(new Set())

    const creators = data?.data || []

    const handleFollow = (userId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const isFollowing = followedIds.has(userId)
        toggleFollow({ userId, isFollowing })
        setFollowedIds(prev => {
            const next = new Set(prev)
            isFollowing ? next.delete(userId) : next.add(userId)
            return next
        })
    }

    return (
        <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl md:rounded-2xl overflow-hidden border border-slate-200/50 dark:border-white/5">
            <div className="flex items-center gap-2 p-3 md:p-4 md:pb-2">
                <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    person_add
                </span>
                <h3 className="text-base md:text-lg font-bold tracking-tight">Suggested Creators</h3>
            </div>

            <div className="flex flex-col">
                {isLoading ? (
                    <div className="p-3 md:p-4 space-y-3 md:space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-2 md:gap-3 animate-pulse">
                                <div className="size-10 md:size-11 rounded-full bg-slate-200 dark:bg-slate-800" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                                    <div className="h-2 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                                </div>
                                <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : creators.length > 0 ? (
                    creators.slice(0, 5).map((creator) => {
                        const isFollowing = followedIds.has(creator.id)
                        return (
                            <div
                                key={creator.id}
                                className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-all cursor-pointer group"
                                onClick={() => router.push(`/${creator.username}`)}
                            >
                                {/* Avatar */}
                                <div className="size-10 md:size-11 rounded-full bg-slate-300 dark:bg-slate-700 overflow-hidden shrink-0 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                                    <img
                                        src={creator.avatarUrl || `https://api.dicebear.com/7.x/beta/svg?seed=${creator.username}`}
                                        alt={creator.name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                        <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{creator.name}</p>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate">
                                        {creator.bio || `@${creator.username}`}
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        {creator.followersCount?.toLocaleString() || 0} followers
                                    </p>
                                </div>

                                {/* Follow Button */}
                                <button
                                    disabled={isPending}
                                    onClick={(e) => handleFollow(creator.id, e)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 disabled:opacity-50 shrink-0",
                                        "active:scale-95",
                                        isFollowing
                                            ? "bg-transparent border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50"
                                            : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
                                    )}
                                >
                                    {isFollowing ? "Following" : "Follow"}
                                </button>
                            </div>
                        )
                    })
                ) : (
                    <div className="p-6 text-center">
                        <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-700 mb-1 block">group</span>
                        <p className="text-sm text-slate-500">No suggestions yet</p>
                    </div>
                )}
            </div>
        </div>
    )
}
