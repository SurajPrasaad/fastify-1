import { useInfiniteQuery } from "@tanstack/react-query";
import { getFollowers, getFollowing } from "./api";

export const useFollowers = (username: string) => {
    return useInfiniteQuery({
        queryKey: ["followers", username],
        queryFn: ({ pageParam = 0 }) => getFollowers(username, 20, pageParam as number),
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === 20 ? allPages.length * 20 : undefined;
        },
        initialPageParam: 0,
        enabled: !!username,
    });
};

export const useFollowing = (username: string) => {
    return useInfiniteQuery({
        queryKey: ["following", username],
        queryFn: ({ pageParam = 0 }) => getFollowing(username, 20, pageParam as number),
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === 20 ? allPages.length * 20 : undefined;
        },
        initialPageParam: 0,
        enabled: !!username,
    });
};
