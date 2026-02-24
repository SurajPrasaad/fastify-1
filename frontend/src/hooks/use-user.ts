"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserService } from "@/services/user.service";
import { AuthService } from "@/services/auth.service";
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

export const usePrivacy = () => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ["user-privacy"],
        queryFn: UserService.getPrivacy,
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => UserService.updatePrivacy(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-privacy"] });
            toast.success("Privacy settings updated");
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to update privacy settings");
        }
    });

    return {
        privacy: query.data,
        isLoading: query.isLoading,
        updatePrivacy: updateMutation.mutate,
        isUpdating: updateMutation.isPending,
    };
};
export const useSecurity = () => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ["user-security"],
        queryFn: UserService.getSecurity,
    });

    const revokeSessionMutation = useMutation({
        mutationFn: UserService.revokeSession,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-security"] });
            toast.success("Session revoked");
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to revoke session");
        }
    });

    const revokeAppMutation = useMutation({
        mutationFn: UserService.revokeApp,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-security"] });
            toast.success("App access revoked");
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to revoke app access");
        }
    });

    const setup2FAMutation = useMutation({
        mutationFn: AuthService.setup2FA,
    });

    const verify2FAMutation = useMutation({
        mutationFn: AuthService.verify2FA,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-security"] });
            toast.success("2FA enabled successfully");
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to verify 2FA code");
        }
    });

    const changePasswordMutation = useMutation({
        mutationFn: AuthService.changePassword,
        onSuccess: () => {
            toast.success("Password changed successfully");
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to change password");
        }
    });

    return {
        security: query.data,
        isLoading: query.isLoading,
        revokeSession: revokeSessionMutation.mutate,
        isRevokingSession: revokeSessionMutation.isPending,
        revokeApp: revokeAppMutation.mutate,
        isRevokingApp: revokeAppMutation.isPending,
        setup2FA: setup2FAMutation.mutateAsync,
        isSettingUp2FA: setup2FAMutation.isPending,
        verify2FA: verify2FAMutation.mutateAsync,
        isVerifying2FA: verify2FAMutation.isPending,
        changePassword: changePasswordMutation.mutateAsync,
        isChangingPassword: changePasswordMutation.isPending,
    };
};

export const useNotificationSettings = () => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ["notification-settings"],
        queryFn: UserService.getNotificationSettings,
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => UserService.updateNotificationSettings(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
            toast.success("Notification settings updated");
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to update notification settings");
        }
    });

    return {
        settings: query.data,
        isLoading: query.isLoading,
        updateSettings: updateMutation.mutate,
        isUpdating: updateMutation.isPending,
    };
};
