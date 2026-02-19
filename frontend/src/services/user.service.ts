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
    }
};
