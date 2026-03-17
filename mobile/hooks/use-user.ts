import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserService } from "../services/user-service";
import { useAuthStore } from "../store/auth-store";
import { Alert } from "react-native";

export const useProfile = (username: string) => {
    return useQuery({
        queryKey: ["profile", username],
        queryFn: () => UserService.getProfile(username),
        enabled: !!username,
    });
};

export const useSocial = (userId: string, username: string) => {
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuthStore();

    const invalidateQueries = () => {
        queryClient.invalidateQueries({ queryKey: ["profile", username] });
        if (currentUser?.username) {
            queryClient.invalidateQueries({ queryKey: ["profile", currentUser.username] });
        }
    };

    const followMutation = useMutation({
        mutationFn: () => UserService.followUser(userId),
        onSuccess: () => {
            invalidateQueries();
        },
        onError: (error: any) => {
            Alert.alert("Error", error.message || "Failed to follow user");
        }
    });

    const unfollowMutation = useMutation({
        mutationFn: () => UserService.unfollowUser(userId),
        onSuccess: () => {
            invalidateQueries();
        },
        onError: (error: any) => {
            Alert.alert("Error", error.message || "Failed to unfollow user");
        }
    });

    return {
        follow: followMutation.mutate,
        isFollowing: followMutation.isPending,
        unfollow: unfollowMutation.mutate,
        isUnfollowing: unfollowMutation.isPending,
    };
};
