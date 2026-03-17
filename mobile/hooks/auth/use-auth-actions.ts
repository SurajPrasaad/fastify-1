import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthApi } from "../../services/auth-api";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { useAuthStore } from "../../store/auth-store";

export const useAuthActions = () => {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { setUser, setToken, logout: clearAuth } = useAuthStore();

    const loginMutation = useMutation({
        mutationFn: ({ email, password, deviceId }: any) =>
            AuthApi.login(email, password, deviceId),
        onSuccess: (data) => {
            if (!data.mfaRequired) {
                setToken(data.accessToken);
                setUser(data.user);
                queryClient.setQueryData(["auth", "me"], data.user);
                // Redirect to main app
                router.replace("/(tabs)");
            }
        },
        onError: (error: any) => {
            Alert.alert("Login Failed", error.message || "Invalid credentials");
        }
    });

    const registerMutation = useMutation({
        mutationFn: (data: any) => AuthApi.register(data),
        onSuccess: () => {
            Alert.alert("Success", "Account created! Please verify your email.");
            router.push("/(auth)/login");
        },
        onError: (error: any) => {
            Alert.alert("Registration Failed", error.message || "An unexpected error occurred");
        }
    });

    const logout = async () => {
        try {
            await AuthApi.logout();
            clearAuth();
            queryClient.setQueryData(["auth", "me"], null);
            queryClient.clear();
            router.replace("/(auth)/login" as any);
        } catch (error) {
            // Even if API logout fails, we clear local session
            clearAuth();
            router.replace("/(auth)/login" as any);
        }
    };

    return {
        login: loginMutation.mutateAsync,
        isLoggingIn: loginMutation.isPending,
        register: registerMutation.mutateAsync,
        isRegistering: registerMutation.isPending,
        logout,
    };
};
