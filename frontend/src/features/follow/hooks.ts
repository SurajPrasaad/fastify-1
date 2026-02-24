import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFollowers, getFollowing, followUser, unfollowUser } from "./api";
import { toast } from "sonner";
export const useToggleFollow = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, isFollowing }: { userId: string; isFollowing: boolean }) =>
            isFollowing ? unfollowUser(userId) : followUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-suggestions"] });
            queryClient.invalidateQueries({ queryKey: ["following"] });
            queryClient.invalidateQueries({ queryKey: ["followers"] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update follow status");
        }
    });
};
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
