"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { CategoryTab } from "@/features/explore/types"

const CATEGORIES: CategoryTab[] = [
    { slug: "for-you", label: "For You", icon: "auto_awesome" },
    { slug: "trending", label: "Trending", icon: "trending_up" },
    { slug: "ai", label: "AI", icon: "smart_toy" },
    { slug: "tech", label: "Tech", icon: "code" },
    { slug: "design", label: "Design", icon: "palette" },
    { slug: "startups", label: "Startups", icon: "rocket_launch" },
    { slug: "gaming", label: "Gaming", icon: "sports_esports" },
    { slug: "news", label: "News", icon: "newspaper" },
    { slug: "sports", label: "Sports", icon: "sports_soccer" },
    { slug: "music", label: "Music", icon: "music_note" },
]

interface ExploreCategoryTabsProps {
    activeCategory: string
    onCategoryChange: (slug: string) => void
}

export function ExploreCategoryTabs({ activeCategory, onCategoryChange }: ExploreCategoryTabsProps) {
    const scrollRef = React.useRef<HTMLDivElement>(null)

    return (
        <div className="relative">
            {/* Fade edges for scroll indication */}
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            <div
                ref={scrollRef}
                className="flex gap-2 overflow-x-auto px-6 py-4 hidden-scrollbar scroll-smooth"
            >
                {CATEGORIES.map((cat) => {
                    const isActive = activeCategory === cat.slug
                    return (
                        <button
                            key={cat.slug}
                            onClick={() => onCategoryChange(cat.slug)}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap",
                                "transition-all duration-200 ease-out shrink-0",
                                "active:scale-95",
                                isActive
                                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-700 dark:hover:text-slate-200"
                            )}
                        >
                            <span
                                className="material-symbols-outlined text-[18px]"
                                style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}
                            >
                                {cat.icon}
                            </span>
                            {cat.label}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
