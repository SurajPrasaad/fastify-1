
import { api } from "@/lib/api-client";
import { Post, ApiPost, PaginatedResult } from "../posts/types";
import { mapApiPostToPost } from "../posts/api";

export const getMyLikedPosts = async (limit = 10, cursor?: string): Promise<PaginatedResult<Post>> => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append("cursor", cursor);

    const response = await api.get<PaginatedResult<ApiPost>>(`/users/me/likes?${params.toString()}`);

    return {
        ...response,
        data: response.data.map(mapApiPostToPost)
    };
};

export const getUserLikedPosts = async (username: string, limit = 10, cursor?: string): Promise<PaginatedResult<Post>> => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append("cursor", cursor);

    const response = await api.get<PaginatedResult<ApiPost>>(`/users/${username}/likes?${params.toString()}`);

    return {
        ...response,
        data: response.data.map(mapApiPostToPost)
    };
};
