import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { FeedApi, FeedParams } from "@/services/feed-api";

export function useTrendingHashtags(limit: number = 5) {
    return useQuery({
        queryKey: ['explore', 'hashtags', 'trending', limit],
        queryFn: () => FeedApi.getTrendingHashtags(limit)
    });
}

export function useRecommendedCreators(limit: number = 5) {
    return useQuery({
        queryKey: ['explore', 'creators', 'recommended', limit],
        queryFn: () => FeedApi.getRecommendedCreators(limit)
    });
}

export function useExploreFeed(limit: number = 20) {
    return useInfiniteQuery({
        queryKey: ['explore', 'feed', limit],
        queryFn: ({ pageParam }) => FeedApi.getExploreFeed({ limit, cursor: pageParam }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    });
}

export function useExploreSearch(query: string, type: 'posts' | 'users' | 'hashtags' = 'posts', limit: number = 20) {
    return useInfiniteQuery({
        queryKey: ['explore', 'search', query, type, limit],
        queryFn: ({ pageParam }) => FeedApi.search({ q: query, type, limit, cursor: pageParam }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
        enabled: query.length > 2
    });
}
