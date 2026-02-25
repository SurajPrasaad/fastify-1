"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ExploreSearchBar } from "@/features/explore/components/ExploreSearchBar"
import { ExploreCategoryTabs } from "@/features/explore/components/ExploreCategoryTabs"
import { ExplorePostCard } from "@/features/explore/components/ExplorePostCard"
import { TrendingPanel } from "@/features/explore/components/TrendingPanel"
import { CreatorRecommendations } from "@/features/explore/components/CreatorRecommendations"
import {
    ExploreFeedSkeleton,
    ExploreEmptyState,
    BackToTopButton,
    NewContentIndicator,
} from "@/features/explore/components/ExploreSkeletons"
import {
    useExploreFeed,
    useTrendingFeed,
    useCategoryFeed,
} from "@/features/explore/hooks"
import type { ExplorePost } from "@/features/explore/types"

export default function ExplorePage() {
    const [activeCategory, setActiveCategory] = React.useState("for-you")
    const [isSearching, setIsSearching] = React.useState(false)
    const [showBackToTop, setShowBackToTop] = React.useState(false)
    const feedRef = React.useRef<HTMLDivElement>(null)
    const sentinelRef = React.useRef<HTMLDivElement>(null)

    // ─── Feed Hooks ──────────────────────────────────────────────────────
    const exploreFeed = useExploreFeed()
    const trendingFeed = useTrendingFeed()
    const categoryFeed = useCategoryFeed(activeCategory)

    // Select active query based on tab
    const activeQuery = React.useMemo(() => {
        if (activeCategory === "for-you") return exploreFeed
        if (activeCategory === "trending") return trendingFeed
        return categoryFeed
    }, [activeCategory, exploreFeed, trendingFeed, categoryFeed])

    // Flatten pages into a single posts array
    const posts: ExplorePost[] = React.useMemo(() => {
        return activeQuery.data?.pages?.flatMap(page => page.posts || []) || []
    }, [activeQuery.data])

    // ─── Infinite Scroll Observer ────────────────────────────────────────
    React.useEffect(() => {
        const sentinel = sentinelRef.current
        if (!sentinel || !activeQuery.hasNextPage) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !activeQuery.isFetchingNextPage) {
                    activeQuery.fetchNextPage()
                }
            },
            { rootMargin: "300px" }
        )

        observer.observe(sentinel)
        return () => observer.disconnect()
    }, [activeQuery.hasNextPage, activeQuery.isFetchingNextPage, activeQuery.fetchNextPage])

    // ─── Back to Top Visibility ──────────────────────────────────────────
    React.useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 800)
        }
        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const scrollToTop = React.useCallback(() => {
        window.scrollTo({ top: 0, behavior: "smooth" })
    }, [])

    // ─── Category Change Handler ─────────────────────────────────────────
    const handleCategoryChange = React.useCallback((slug: string) => {
        setActiveCategory(slug)
        window.scrollTo({ top: 0, behavior: "smooth" })
    }, [])

    return (
        <div className="flex flex-col min-h-screen" ref={feedRef}>
            {/* ─── Sticky Header ───────────────────────────────────────────── */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-background/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/30">
                {/* Page Title */}
                <div className="flex items-center justify-between px-6 pt-4 pb-2">
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl font-bold tracking-tight">Explore</h1>
                        <span className="relative flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-full">
                            <span className="material-symbols-outlined text-primary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                auto_awesome
                            </span>
                            <span className="text-[11px] font-bold text-primary">AI</span>
                        </span>
                    </div>
                    <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all">
                        <span className="material-symbols-outlined text-[22px] text-slate-600 dark:text-slate-400">
                            tune
                        </span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-6 pb-3">
                    <ExploreSearchBar onSearchStateChange={setIsSearching} />
                </div>

                {/* Category Tabs */}
                {!isSearching && (
                    <ExploreCategoryTabs
                        activeCategory={activeCategory}
                        onCategoryChange={handleCategoryChange}
                    />
                )}
            </header>

            {/* ─── Feed Content ─────────────────────────────────────────── */}
            <div className={cn(
                "flex-1 transition-all duration-300",
                isSearching && "opacity-40 pointer-events-none"
            )}>
                {/* Inline trending + creators for "For You" tab */}
                {activeCategory === "for-you" && !activeQuery.isLoading && posts.length > 0 && (
                    <div className="lg:hidden px-4 py-4 space-y-4 border-b border-slate-200/60 dark:border-slate-800/40">
                        <TrendingPanel />
                        <CreatorRecommendations />
                    </div>
                )}

                {/* Posts Feed */}
                {activeQuery.isLoading ? (
                    <ExploreFeedSkeleton />
                ) : posts.length > 0 ? (
                    <div>
                        {posts.map((post, idx) => (
                            <ExplorePostCard key={post.id} post={post} index={idx} />
                        ))}

                        {/* Infinite scroll sentinel */}
                        <div ref={sentinelRef} className="h-1" />

                        {/* Loading more indicator */}
                        {activeQuery.isFetchingNextPage && (
                            <div className="py-8 flex justify-center">
                                <div className="flex items-center gap-3 text-slate-500">
                                    <div className="size-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                    <span className="text-sm font-medium">Loading more...</span>
                                </div>
                            </div>
                        )}

                        {/* End of feed */}
                        {!activeQuery.hasNextPage && posts.length > 5 && (
                            <div className="py-12 text-center border-t border-slate-200/60 dark:border-slate-800/40">
                                <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-700 mb-2 block">
                                    check_circle
                                </span>
                                <p className="text-sm text-slate-500 font-medium">You&apos;re all caught up!</p>
                                <p className="text-xs text-slate-400 mt-1">Check back later for new content</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <ExploreEmptyState
                        type={activeCategory === "for-you" ? "feed" : "category"}
                    />
                )}
            </div>

            {/* ─── Floating Elements ───────────────────────────────────── */}
            <BackToTopButton visible={showBackToTop} onClick={scrollToTop} />
        </div>
    )
}
