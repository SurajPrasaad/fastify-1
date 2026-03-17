import { useInfiniteQuery } from "@tanstack/react-query";
import { FeedApi } from "../services/feed-api";

export const useBookmarks = () => {
    return useInfiniteQuery({
        queryKey: ["bookmarks"],
        queryFn: async ({ pageParam }) => {
            return FeedApi.getBookmarks({ cursor: pageParam as string });
        },
        getNextPageParam: (lastPage) => lastPage.meta?.nextCursor ?? undefined,
        initialPageParam: undefined as string | undefined,
    });
};
