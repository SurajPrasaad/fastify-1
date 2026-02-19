"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthService } from "@/services/auth.service";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useEffect } from "react";

export const useUser = () => {
    return useQuery({
        queryKey: ["auth", "me"],
        queryFn: AuthService.getMe,
        staleTime: Infinity, // User doesn't change often
        retry: false,
    });
};

export const useAuth = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    const loginMutation = useMutation({
        mutationFn: ({ email, password, deviceId }: any) =>
            AuthService.login(email, password, deviceId),
        onSuccess: (data) => {
            if (!data.mfaRequired) {
                queryClient.setQueryData(["auth", "me"], data.user);
                toast.success("Welcome back!");
                router.push("/");
            }
        },
    });

    const registerMutation = useMutation({
        mutationFn: (data: any) => AuthService.register(data),
        onSuccess: (data) => {
            queryClient.setQueryData(["auth", "me"], data.user);
            toast.success("Account created successfully! Please sign in.");
            router.push("/login");
        },
    });

    const logoutMutation = useMutation({
        mutationFn: AuthService.logout,
        onSuccess: () => {
            queryClient.setQueryData(["auth", "me"], null);
            queryClient.clear();
            router.push("/login");
            toast.success("Logged out successfully");
        },
    });

    const updateProfileMutation = useMutation({
        mutationFn: (data: any) => AuthService.updateProfile(data),
        onSuccess: (updatedUser) => {
            queryClient.setQueryData(["auth", "me"], updatedUser);
            toast.success("Profile updated successfully");
        },
    });

    return {
        login: loginMutation.mutate,
        isLoggingIn: loginMutation.isPending,
        register: registerMutation.mutate,
        isRegistering: registerMutation.isPending,
        logout: logoutMutation.mutate,
        isLoggingOut: logoutMutation.isPending,
        updateProfile: updateProfileMutation.mutate,
        isUpdatingProfile: updateProfileMutation.isPending,
        user: useUser().data,
        isLoading: useUser().isLoading,
    };
};

/**
 * Hook to initialize auth state (e.g., refresh token on boot)
 */
export const useAuthInit = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const initAuth = async () => {
            try {
                // Attempt to refresh token on app load
                const res = await AuthService.refresh();
                if (res.accessToken) {
                    queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
                }
            } catch (err) {
                // No session found, silent fail
            }
        };

        initAuth();
    }, [queryClient]);
};
