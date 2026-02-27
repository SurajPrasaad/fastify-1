"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthApi } from "./api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect } from "react";
import { User } from "./types";

export const useCurrentUser = () => {
    return useQuery({
        queryKey: ["auth", "me"],
        queryFn: AuthApi.getMe,
        staleTime: 5 * 60 * 1000,
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });
};

export const useAuthActions = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    const loginMutation = useMutation({
        mutationFn: ({ email, password, deviceId }: any) =>
            AuthApi.login(email, password, deviceId),
        onSuccess: (data) => {
            if (!data.mfaRequired) {
                queryClient.setQueryData(["auth", "me"], data.user);
                toast.success("Welcome back!");
                const redirectPath = data.user.auth.role === 'ADMIN' ? '/admin' : '/';
                router.replace(redirectPath);
            }
        },
    });

    const googleLoginMutation = useMutation({
        mutationFn: ({ idToken, deviceId }: any) =>
            AuthApi.googleLogin(idToken, deviceId),
        onSuccess: (data) => {
            if (!data.mfaRequired) {
                queryClient.setQueryData(["auth", "me"], data.user);
                toast.success("Signed in with Google!");
                const redirectPath = data.user.auth.role === 'ADMIN' ? '/admin' : '/';
                router.replace(redirectPath);
            }
        },
    });

    const registerMutation = useMutation({
        mutationFn: (data: any) => AuthApi.register(data),
        onSuccess: () => {
            toast.success("Account created! Please verify your email.");
        },
    });

    const logoutMutation = useMutation({
        mutationFn: AuthApi.logout,
        onSuccess: () => {
            queryClient.setQueryData(["auth", "me"], null);
            queryClient.clear();
            router.replace("/login");
            toast.success("Logged out successfully");
        },
    });

    const login2FAMutation = useMutation({
        mutationFn: ({ tempToken, code, deviceId }: any) =>
            AuthApi.login2FA(tempToken, code, deviceId),
        onSuccess: (data) => {
            queryClient.setQueryData(["auth", "me"], data.user);
            toast.success("Security verification successful!");
            const redirectPath = data.user.auth.role === 'ADMIN' ? '/admin' : '/';
            router.replace(redirectPath);
        },
    });

    return {
        login: loginMutation.mutateAsync,
        isLoggingIn: loginMutation.isPending,
        googleLogin: googleLoginMutation.mutateAsync,
        isGoogleLoggingIn: googleLoginMutation.isPending,
        register: registerMutation.mutateAsync,
        isRegistering: registerMutation.isPending,
        logout: logoutMutation.mutate,
        isLoggingOut: logoutMutation.isPending,
        login2FA: login2FAMutation.mutateAsync,
        isLoggingIn2FA: login2FAMutation.isPending,
    };
};

export const use2FA = () => {
    const setup2FAMutation = useMutation({
        mutationFn: AuthApi.setup2FA,
    });

    const verify2FAMutation = useMutation({
        mutationFn: AuthApi.verify2FA,
        onSuccess: () => {
            toast.success("2FA enabled successfully!");
        },
    });

    return {
        setup: setup2FAMutation.mutateAsync,
        isSettingUp: setup2FAMutation.isPending,
        verify: verify2FAMutation.mutateAsync,
        isVerifying: verify2FAMutation.isPending,
    };
};

export const useEmailVerification = () => {
    const mutation = useMutation({
        mutationFn: AuthApi.verifyEmail,
    });

    return {
        verify: mutation.mutateAsync,
        isVerifying: mutation.isPending,
    };
};
