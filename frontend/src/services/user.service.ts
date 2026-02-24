import { api } from "@/lib/api-client";
import { UserResponse } from "@/types/auth";

export interface ProfileResponse extends UserResponse {
    isFollowing: boolean;
    isSelf: boolean;
}

export const UserService = {
    getProfile: async (username: string): Promise<ProfileResponse> => {
        return api.get<ProfileResponse>(`/users/${username}`);
    },

    followUser: async (userId: string): Promise<void> => {
        return api.post(`/users/${userId}/follow`);
    },

    unfollowUser: async (userId: string): Promise<void> => {
        return api.post(`/users/${userId}/unfollow`);
    },

    getPrivacy: async (): Promise<any> => {
        return api.get("/users/me/privacy");
    },

    updatePrivacy: async (data: any): Promise<any> => {
        return api.patch("/users/me/privacy", data);
    },

    getSecurity: async (): Promise<any> => {
        return api.get("/users/me/security");
    },

    revokeSession: async (sessionId: string): Promise<any> => {
        return api.delete(`/users/me/security/sessions/${sessionId}`);
    },

    revokeApp: async (appId: string): Promise<any> => {
        return api.delete(`/users/me/security/apps/${appId}`);
    },

    getNotificationSettings: async (): Promise<any> => {
        return api.get("/users/me/notifications/settings");
    },

    updateNotificationSettings: async (data: any): Promise<any> => {
        return api.patch("/users/me/notifications/settings", data);
    }
};
