"use client";

import { useInfiniteFeed } from "../hooks/useInfiniteFeed";
import { FeedList } from "./FeedList";
import { useRealtimeFeed } from "../hooks/useRealtimeFeed";

interface FeedPageProps {
    type: 'home' | 'explore' | 'hashtag';
    tag?: string;
    title: string;
}

export const FeedPageContent = ({ type, tag, title }: FeedPageProps) => {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error,
        refetch
    } = useInfiniteFeed(type, tag);

    // Subscribe to real-time updates
    useRealtimeFeed();

    const posts = data?.pages.flatMap((page) => page.data) || [];

    return (
        <div className="flex flex-col h-screen border-x border-gray-100 dark:border-gray-800 bg-white dark:bg-black mx-auto">
            {/* Smooth Sticky Header */}
            <header className="sticky top-0 z-10 backdrop-blur-md bg-white/70 dark:bg-black/70 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between px-4 py-3">
                    <h1 className="text-xl font-bold tracking-tight">{title}</h1>
                    <div className="flex items-center space-x-2">
                        {/* Optional filters/actions */}
                    </div>
                </div>
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
