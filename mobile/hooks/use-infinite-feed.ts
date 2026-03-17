import { useInfiniteQuery } from "@tanstack/react-query";
import { FeedApi, FeedParams } from "../services/feed-api";

export const useInfiniteFeed = (type: 'FOR_YOU' | 'FOLLOWING' | 'explore' | 'hashtag', tag?: string) => {
    return useInfiniteQuery({
        queryKey: ["feed", type, tag],
        queryFn: async ({ pageParam = 1 }) => {
            const params: FeedParams = {
                page: pageParam as number,
                limit: 20,
                type,
                tag
            };

            if (type === 'explore') {
                return FeedApi.getExploreFeed(params);
            } else if (type === 'hashtag' && tag) {
                return FeedApi.getHashtagFeed({ tag, ...params });
            } else {
                return FeedApi.getHomeFeed(params);
            }
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            if (lastPage.meta?.hasNextPage && lastPage.meta?.page !== undefined) {
                return lastPage.meta.page + 1;
            }
            return undefined;
        },
    });
};
