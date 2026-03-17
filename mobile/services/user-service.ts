import { api } from "./api-client";
import { User } from "../types/auth";

export interface ProfileResponse extends User {
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

    searchUsers: async (query: string): Promise<User[]> => {
        return api.get<User[]>(`/users/search-users?q=${encodeURIComponent(query)}`);
    }
};
