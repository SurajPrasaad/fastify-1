"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserService } from "@/services/user.service";
import { toast } from "sonner";

import { useUser } from "./use-auth";

export const useProfile = (username: string) => {
    return useQuery({
        queryKey: ["profile", username],
        queryFn: () => UserService.getProfile(username),
        enabled: !!username,
    });
};

export const useSocial = (userId: string, username: string) => {
    const queryClient = useQueryClient();
    const { data: currentUser } = useUser();

    const invalidateQueries = () => {
        // 1. Invalidate target user's profile (to update their follower count)
        queryClient.invalidateQueries({ queryKey: ["profile", username] });

        // 2. Invalidate target user's followers list
        queryClient.invalidateQueries({ queryKey: ["followers", username] });

        if (currentUser?.username) {
            // 3. Invalidate current user's profile (to update my following count)
            queryClient.invalidateQueries({ queryKey: ["profile", currentUser.username] });

            // 4. Invalidate current user's following list (to remove/add user from list)
            queryClient.invalidateQueries({ queryKey: ["following", currentUser.username] });
        }
    };

    const followMutation = useMutation({
        mutationFn: () => UserService.followUser(userId),
        onSuccess: () => {
            invalidateQueries();
            toast.success("Followed successfully");
        },
    });

    const unfollowMutation = useMutation({
        mutationFn: () => UserService.unfollowUser(userId),
        onSuccess: () => {
            invalidateQueries();
            toast.success("Unfollowed successfully");
        },
    });

    return {
        follow: followMutation.mutate,
        isFollowing: followMutation.isPending,
        unfollow: unfollowMutation.mutate,
        isUnfollowing: unfollowMutation.isPending,
    };
};
