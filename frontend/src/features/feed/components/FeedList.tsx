import { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { FeedPost } from '../types/feed.types';
import { PostCard } from './PostCard';
import { FeedSkeleton } from './FeedSkeleton';
import { EmptyState, ErrorState } from './FeedStates';

interface FeedListProps {
    posts: FeedPost[];
    isLoading: boolean;
    isError: boolean;
    error: any;
    hasNextPage: boolean;
    fetchNextPage: () => void;
    isFetchingNextPage: boolean;
    refreshing?: boolean;
    onRefresh?: () => void;
}

export const FeedList = ({
    posts,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
}: FeedListProps) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Virtualizer for 100K+ posts support
    const rowVirtualizer = useVirtualizer({
        count: posts.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 400, // Estimated height of a post
        overscan: 5,
    });

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    if (isLoading && posts.length === 0) return <FeedSkeleton />;
    if (isError) return <ErrorState error={error?.message || "Failed to load feed"} retry={fetchNextPage} />;
    if (posts.length === 0 && !isLoading) return <EmptyState />;

    return (
        <div
            ref={parentRef}
            className="h-full overflow-y-auto scrollbar-hide"
            style={{ contain: 'strict' }}
        >
            <div
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const post = posts[virtualRow.index];
                    return (
                        <div
                            key={virtualRow.key}
                            data-index={virtualRow.index}
                            ref={rowVirtualizer.measureElement}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                        >
                            <PostCard post={post} />
                        </div>
                    );
                })}
            </div>

            {/* Pagination Loader */}
            <div ref={loadMoreRef} className="py-8">
                {isFetchingNextPage && <FeedSkeleton />}
                {!hasNextPage && posts.length > 0 && (
                    <p className="text-center text-gray-500 text-sm py-4">
                        You've reached the end of the feed.
                    </p>
                )}
            </div>
        </div>
    );
};
