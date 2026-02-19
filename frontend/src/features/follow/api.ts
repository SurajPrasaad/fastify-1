import { api } from "@/lib/api-client";
import { FollowUser } from "./types";

export const getFollowers = async (username: string, limit = 20, offset = 0): Promise<FollowUser[]> => {
    return api.get<FollowUser[]>(`/users/${username}/followers?limit=${limit}&offset=${offset}`);
};

export const getFollowing = async (username: string, limit = 20, offset = 0): Promise<FollowUser[]> => {
    return api.get<FollowUser[]>(`/users/${username}/following?limit=${limit}&offset=${offset}`);
};
