import { useQuery, useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { exploreApi } from "./api";
import type { ExploreFeedResponse } from "./types";

/**
 * Personalized "For You" explore feed with infinite scroll
 */
export function useExploreFeed(region?: string) {
    return useInfiniteQuery({
        queryKey: ["explore-feed", region],
        queryFn: ({ pageParam }) =>
            exploreApi.getExploreFeed({
                cursor: pageParam as string | undefined,
                limit: 20,
                region,
            }),
        getNextPageParam: (lastPage: ExploreFeedResponse) =>
            lastPage.hasMore ? lastPage.nextCursor : undefined,
        initialPageParam: undefined as string | undefined,
        staleTime: 1000 * 60 * 2,
        refetchOnWindowFocus: false,
    });
}

/**
 * Trending feed with infinite scroll
 */
export function useTrendingFeed(region?: string, timeWindow?: string) {
    return useInfiniteQuery({
        queryKey: ["trending-feed", region, timeWindow],
        queryFn: ({ pageParam }) =>
            exploreApi.getTrendingFeed({
                cursor: pageParam as string | undefined,
                limit: 20,
                region,
                timeWindow,
            }),
        getNextPageParam: (lastPage: ExploreFeedResponse) =>
            lastPage.hasMore ? lastPage.nextCursor : undefined,
        initialPageParam: undefined as string | undefined,
        staleTime: 1000 * 60 * 2,
    });
}

/**
 * Category feed with infinite scroll
 */
export function useCategoryFeed(slug: string) {
    return useInfiniteQuery({
        queryKey: ["category-feed", slug],
        queryFn: ({ pageParam }) =>
            exploreApi.getCategoryFeed(slug, {
                cursor: pageParam as string | undefined,
                limit: 20,
            }),
        getNextPageParam: (lastPage: ExploreFeedResponse) =>
            lastPage.hasMore ? lastPage.nextCursor : undefined,
        initialPageParam: undefined as string | undefined,
        enabled: !!slug && slug !== "for-you" && slug !== "trending",
        staleTime: 1000 * 60 * 3,
    });
}

/**
 * Search with debounced query
 */
export function useExploreSearch(query: string, type: string = "posts") {
    return useQuery({
        queryKey: ["explore-search", query, type],
        queryFn: () => exploreApi.search({ q: query, type, limit: 20 }),
        enabled: query.length >= 2,
        staleTime: 1000 * 30,
    });
}

/**
 * Recommended creators
 */
export function useExploreCreators(category?: string) {
    return useQuery({
        queryKey: ["explore-creators", category],
        queryFn: () => exploreApi.getCreators({ limit: 10, category }),
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Trending hashtags
 */
export function useExploreTrendingHashtags() {
    return useQuery({
        queryKey: ["explore-trending-hashtags"],
        queryFn: () => exploreApi.getTrendingHashtags({ limit: 20 }),
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Track interaction (fire-and-forget) for personalization
 */
export function useTrackExploreInteraction() {
    return useMutation({
        mutationFn: exploreApi.trackInteraction,
    });
}
