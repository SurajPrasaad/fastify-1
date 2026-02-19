import { api } from "@/lib/api-client";
import { Reply, PaginatedResult } from "./types";

export const getMyReplies = async (limit = 10, cursor?: string): Promise<PaginatedResult<Reply>> => {
    const params = new URLSearchParams({
        limit: limit.toString(),
    });
    if (cursor) params.append("cursor", cursor);

    return api.get<PaginatedResult<Reply>>(`/users/me/replies?${params.toString()}`);
};

/**
 * For SSR on the first page load
 */
export const fetchInitialReplies = async (username: string, limit = 10): Promise<PaginatedResult<Reply>> => {
    // Note: In an enterprise app, we might check if 'me' refers to authors specified by username
    // but for now we follow the 'me' requirement.
    // Ideally, for other users' profile replies, we would have /users/:username/replies
    const params = new URLSearchParams({
        limit: limit.toString(),
    });

    // Server-side fetch requires absolute URL or configured proxy
    return api.get<PaginatedResult<Reply>>(`/users/me/replies?${params.toString()}`);
};
