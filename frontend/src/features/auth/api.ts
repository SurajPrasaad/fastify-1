import { api } from "@/lib/api-client";
import {
    User,
    LoginResponse,
    RegisterResponse,
    AuthResponse
} from "./types";

export const AuthApi = {
    register: async (data: any): Promise<RegisterResponse> => {
        const response = await api.post<RegisterResponse>("/auth/register", data);
        if (response.accessToken) api.setToken(response.accessToken);
        return response;
    },

    login: async (email: string, password: string, deviceId: string): Promise<LoginResponse> => {
        const response = await api.post<LoginResponse>("/auth/login", {
            email,
            password,
            deviceId,
        });
        if (response.accessToken) api.setToken(response.accessToken);
        return response;
    },

    googleLogin: async (idToken: string, deviceId: string): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>("/auth/google", { idToken, deviceId });
        if (response.accessToken) api.setToken(response.accessToken);
        return response;
    },

    logout: async (): Promise<void> => {
        try {
            await api.post("/auth/logout");
        } finally {
            api.setToken(null);
        }
    },

    getMe: async (): Promise<User | null> => {
        try {
            return await api.get<User>("/auth/me");
        } catch (error: any) {
            if (error.status === 401) return null;
            throw error;
        }
    },

    refresh: async (): Promise<{ accessToken: string } | null> => {
        try {
            const response = await api.post<{ accessToken: string }>("/auth/refresh");
            api.setToken(response.accessToken);
            return response;
        } catch (error: any) {
            if (error.status === 401) return null;
            throw error;
        }
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
        if (response.accessToken) api.setToken(response.accessToken);
        return response;
    },
};
