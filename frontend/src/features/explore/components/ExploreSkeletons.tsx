"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export function ExploreFeedSkeleton() {
    return (
        <div className="animate-in fade-in duration-300">
            {[1, 2, 3, 4, 5].map(i => (
                <div
                    key={i}
                    className="p-5 border-b border-slate-200/60 dark:border-slate-800/40"
                    style={{ animationDelay: `${i * 80}ms` }}
                >
                    <div className="flex gap-3.5 animate-pulse">
                        {/* Avatar skeleton */}
                        <div className="size-11 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />

                        <div className="flex-1 space-y-3">
                            {/* Header skeleton */}
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                                <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                                <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
                            </div>

                            {/* Content skeleton */}
                            <div className="space-y-2">
                                <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                                <div className="h-3.5 w-4/5 bg-slate-200 dark:bg-slate-800 rounded" />
                                <div className="h-3.5 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
                            </div>

                            {/* Media skeleton (randomly shown) */}
                            {i % 2 === 0 && (
                                <div className="h-48 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                            )}

                            {/* Engagement skeleton */}
                            <div className="flex gap-10 pt-1">
                                <div className="h-4 w-10 bg-slate-200 dark:bg-slate-800 rounded" />
                                <div className="h-4 w-10 bg-slate-200 dark:bg-slate-800 rounded" />
                                <div className="h-4 w-10 bg-slate-200 dark:bg-slate-800 rounded" />
                                <div className="h-4 w-6 bg-slate-200 dark:bg-slate-800 rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export function ExploreEmptyState({ type = "feed" }: { type?: "feed" | "search" | "category" }) {
    const configs = {
        feed: {
            icon: "auto_awesome",
            title: "We're learning your interests",
            subtitle: "Like, share, and interact with content to get personalized recommendations.",
            action: "Explore trending topics to get started",
        },
        search: {
            icon: "search_off",
            title: "No results found",
            subtitle: "Try different keywords or check the spelling.",
            action: "Reset your filters",
        },
        category: {
            icon: "category",
            title: "Nothing here yet",
            subtitle: "Be the first to post in this category!",
            action: "Explore other categories",
        },
    }

    const config = configs[type]

    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in zoom-in-95 duration-500">
            {/* Animated background glow */}
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl scale-150 animate-pulse" />
                <div className="relative size-20 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-slate-400 dark:text-slate-600">
                        {config.icon}
                    </span>
                </div>
            </div>

            <h3 className="text-xl font-bold mb-2 tracking-tight">{config.title}</h3>
            <p className="text-sm text-slate-500 max-w-[300px] mb-4 leading-relaxed">{config.subtitle}</p>
            <p className="text-xs text-primary font-medium">{config.action}</p>
        </div>
    )
}

export function NewContentIndicator({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "fixed top-20 left-1/2 -translate-x-1/2 z-50",
                "flex items-center gap-2 px-5 py-2.5 rounded-full",
                "bg-primary text-white text-sm font-bold",
                "shadow-lg shadow-primary/30 hover:shadow-primary/50",
                "hover:scale-105 active:scale-95 transition-all duration-200",
                "animate-in slide-in-from-top-4 fade-in duration-300"
            )}
        >
            <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
            New posts
        </button>
    )
}

export function BackToTopButton({ visible, onClick }: { visible: boolean; onClick: () => void }) {
    if (!visible) return null

    return (
        <button
            onClick={onClick}
            className={cn(
                "fixed bottom-24 md:bottom-8 right-6 z-50",
                "size-12 rounded-full",
                "bg-primary text-white",
                "shadow-lg shadow-primary/30 hover:shadow-primary/50",
                "hover:scale-110 active:scale-95 transition-all duration-200",
                "flex items-center justify-center",
                "animate-in slide-in-from-bottom-4 fade-in duration-300"
            )}
        >
            <span className="material-symbols-outlined">keyboard_arrow_up</span>
        </button>
    )
}
