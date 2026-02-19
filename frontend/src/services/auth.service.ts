import { api } from "@/lib/api-client";
import {
    LoginResponse,
    RegisterResponse,
    UserResponse
} from "@/types/auth";

export const AuthService = {
    login: async (email: string, password: string, deviceId: string): Promise<LoginResponse> => {
        const response = await api.post<LoginResponse>("/auth/login", {
            email,
            password,
            deviceId,
        });

        if (response.accessToken) {
            api.setToken(response.accessToken);
        }

        return response;
    },

    register: async (data: any): Promise<RegisterResponse> => {
        const response = await api.post<RegisterResponse>("/auth/register", data);

        if (response.accessToken) {
            api.setToken(response.accessToken);
        }

        return response;
    },

    logout: async (): Promise<void> => {
        try {
            await api.post("/auth/logout");
        } finally {
            api.setToken(null);
        }
    },

    getMe: async (): Promise<UserResponse> => {
        return api.get<UserResponse>("/auth/me");
    },

    updateProfile: async (data: any): Promise<UserResponse> => {
        return api.patch<UserResponse>("/users/me", data);
    },

    refresh: async (): Promise<{ accessToken: string }> => {
        const response = await api.post<{ accessToken: string }>("/auth/refresh");
        api.setToken(response.accessToken);
        return response;
    },

    verifyEmail: async (token: string): Promise<{ message: string }> => {
        return api.get(`/auth/verify-email?token=${token}`);
    },

    setup2FA: async (): Promise<{ secret: string; qrCode: string }> => {
        return api.post("/auth/2fa/setup");
    },

    verify2FA: async (token: string): Promise<{ message: string }> => {
        return api.post("/auth/2fa/verify", { token });
    },

    login2FA: async (tempToken: string, code: string, deviceId: string): Promise<LoginResponse> => {
        const response = await api.post<LoginResponse>("/auth/login/2fa", {
            tempToken,
            code,
            deviceId,
        });

        if (response.accessToken) {
            api.setToken(response.accessToken);
        }

        return response;
    },
};
