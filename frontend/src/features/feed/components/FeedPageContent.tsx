"use client";

import * as React from "react";
import { useInfiniteFeed } from "../hooks/useInfiniteFeed";
import { FeedList } from "./FeedList";
import { useRealtimeFeed } from "../hooks/useRealtimeFeed";
import { cn } from "@/lib/utils";

interface FeedPageProps {
    type: 'home' | 'explore' | 'hashtag';
    tag?: string;
    title: string;
}

export const FeedPageContent = ({ type, tag, title }: FeedPageProps) => {
    const [activeTab, setActiveTab] = React.useState<'FOR_YOU' | 'FOLLOWING'>('FOR_YOU');

    const feedType = type === 'home' ? activeTab : (type === 'explore' ? 'explore' : 'hashtag');

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error,
        refetch
    } = useInfiniteFeed(feedType as any, tag);

    // Subscribe to real-time updates
    useRealtimeFeed();

    const posts = data?.pages.flatMap((page) => page.data) || [];

    return (
        <div className="flex flex-col h-screen border-x border-gray-100 dark:border-gray-800 bg-white dark:bg-black mx-auto">
            {/* Smooth Sticky Header */}
            <header className="sticky top-0 z-10 backdrop-blur-md bg-white/70 dark:bg-black/70 border-b border-gray-100 dark:border-gray-800">
                {type === 'home' ? (
                    <div className="flex w-full">
                        <button
                            onClick={() => setActiveTab('FOR_YOU')}
                            className="flex-1 py-4 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors relative"
                        >
                            <span className={cn(
                                "text-sm font-bold",
                                activeTab === 'FOR_YOU' ? "text-primary" : "text-slate-500"
                            )}>For You</span>
                            {activeTab === 'FOR_YOU' && (
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('FOLLOWING')}
                            className="flex-1 py-4 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors relative"
                        >
                            <span className={cn(
                                "text-sm font-bold",
                                activeTab === 'FOLLOWING' ? "text-primary" : "text-slate-500"
                            )}>Following</span>
                            {activeTab === 'FOLLOWING' && (
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between px-4 py-3">
                        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
                    </div>
                )}
            </header>

            {/* Virtualized Feed */}
            <main className="flex-1 overflow-hidden">
                <FeedList
                    posts={posts}
                    isLoading={isLoading}
                    isError={isError}
                    error={error}
                    hasNextPage={!!hasNextPage}
                    fetchNextPage={fetchNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    onRefresh={() => refetch()}
                />
            </main>
        </div>
    );
};
