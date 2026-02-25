"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useExploreTrendingHashtags } from "@/features/explore/hooks"
import { useRouter } from "next/navigation"

export function TrendingPanel() {
    const router = useRouter()
    const { data, isLoading } = useExploreTrendingHashtags()
    const [showAll, setShowAll] = React.useState(false)

    const hashtags = data?.data || []
    const displayed = showAll ? hashtags : hashtags.slice(0, 5)

    // Compute a "heat level" based on post count
    const maxPosts = Math.max(...hashtags.map(h => h.postsCount), 1)
    const getHeat = (count: number) => {
        const ratio = count / maxPosts
        if (ratio > 0.7) return 3 // 🔥🔥🔥
        if (ratio > 0.3) return 2 // 🔥🔥
        return 1                  // 🔥
    }

    return (
        <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl overflow-hidden border border-slate-200/50 dark:border-white/5">
            <div className="flex items-center justify-between p-4 pb-2">
                <h3 className="text-lg font-bold tracking-tight">Trending Now</h3>
                <div className="size-2 bg-primary rounded-full animate-pulse" />
            </div>

            <div className="flex flex-col">
                {isLoading ? (
                    <div className="p-4 space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="animate-pulse space-y-1.5">
                                <div className="h-2 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                                <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                                <div className="h-2 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                            </div>
                        ))}
                    </div>
                ) : displayed.length > 0 ? (
                    displayed.map((hashtag, idx) => {
                        const heat = getHeat(hashtag.postsCount)
                        return (
                            <button
                                key={hashtag.id}
                                onClick={() => router.push(`/hashtag/${hashtag.name}`)}
                                className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-all group"
                            >
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                                        Trending · #{idx + 1}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px] text-emerald-500 group-hover:translate-y-[-2px] transition-transform duration-200">
                                            trending_up
                                        </span>
                                        <span className="text-[10px]">
                                            {Array.from({ length: heat }).map((_, i) => "🔥").join("")}
                                        </span>
                                    </div>
                                </div>
                                <p className="font-bold text-[15px] group-hover:text-primary transition-colors">
                                    #{hashtag.name}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {hashtag.postsCount.toLocaleString()} posts
                                </p>
                            </button>
                        )
                    })
                ) : (
                    <div className="p-6 text-center">
                        <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-700 mb-1 block">trending_flat</span>
                        <p className="text-sm text-slate-500">No trending topics yet</p>
                    </div>
                )}

                {hashtags.length > 5 && (
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="w-full px-4 py-3 text-primary text-sm font-bold hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-all border-t border-slate-100 dark:border-white/5"
                    >
                        {showAll ? "Show less" : "Show more"}
                    </button>
                )}
            </div>
        </div>
    )
}
