import { api } from "@/lib/api-client";
import { FollowUser } from "./types";

export const getFollowers = async (username: string, limit = 20, offset = 0): Promise<FollowUser[]> => {
    return api.get<FollowUser[]>(`/users/${username}/followers?limit=${limit}&offset=${offset}`);
};

export const getFollowing = async (username: string, limit = 20, offset = 0): Promise<FollowUser[]> => {
    return api.get<FollowUser[]>(`/users/${username}/following?limit=${limit}&offset=${offset}`);
};

export const getSuggestions = async (limit = 10): Promise<FollowUser[]> => {
    return api.get<FollowUser[]>(`/users/suggestions?limit=${limit}`);
};

export const followUser = async (userId: string): Promise<void> => {
    return api.post(`/users/${userId}/follow`);
};

export const unfollowUser = async (userId: string): Promise<void> => {
    return api.post(`/users/${userId}/unfollow`);
};

export const getActiveFriends = async (): Promise<FollowUser[]> => {
    return api.get<FollowUser[]>("/users/me/active-friends");
};
