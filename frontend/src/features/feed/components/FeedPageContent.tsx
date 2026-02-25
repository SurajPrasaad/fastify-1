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
        <div className="flex flex-col min-h-screen mx-auto">
            {/* Smooth Sticky Header */}
            <header className="sticky top-0 z-20 backdrop-blur-xl bg-background-light/80 dark:bg-background-dark/80 border-b border-slate-200 dark:border-slate-800/50">
                {type === 'home' ? (
                    <div className="flex w-full">
                        <button
                            onClick={() => setActiveTab('FOR_YOU')}
                            className="flex-1 py-4 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors relative"
                        >
                            <span className={cn(
                                "text-sm font-bold transition-colors",
                                activeTab === 'FOR_YOU' ? "text-slate-900 dark:text-slate-100" : "text-slate-500"
                            )}>For You</span>
                            {activeTab === 'FOR_YOU' && (
                                <div className="absolute bottom-0 left-0 right-0 mx-auto w-16 h-1 bg-primary rounded-full" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('FOLLOWING')}
                            className="flex-1 py-4 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors relative"
                        >
                            <span className={cn(
                                "text-sm font-bold transition-colors",
                                activeTab === 'FOLLOWING' ? "text-slate-900 dark:text-slate-100" : "text-slate-500"
                            )}>Following</span>
                            {activeTab === 'FOLLOWING' && (
                                <div className="absolute bottom-0 left-0 right-0 mx-auto w-16 h-1 bg-primary rounded-full" />
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between px-4 py-3">
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
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
