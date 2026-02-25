import { api } from "@/lib/api-client";
import { Reply, PaginatedResult } from "./types";

export const getMyReplies = async (limit = 10, cursor?: string): Promise<PaginatedResult<Reply>> => {
    const params = new URLSearchParams({
        limit: limit.toString(),
    });
    if (cursor) params.append("cursor", cursor);

    return api.get<PaginatedResult<Reply>>(`/users/me/replies?${params.toString()}`);
};

export const getUserReplies = async (username: string, limit = 10, cursor?: string): Promise<PaginatedResult<Reply>> => {
    const params = new URLSearchParams({
        limit: limit.toString(),
    });
    if (cursor) params.append("cursor", cursor);

    return api.get<PaginatedResult<Reply>>(`/users/${username}/replies?${params.toString()}`);
};

/**
 * For SSR on the first page load
 */
export const fetchInitialReplies = async (username: string, limit = 10): Promise<PaginatedResult<Reply>> => {
    const params = new URLSearchParams({
        limit: limit.toString(),
    });

    return api.get<PaginatedResult<Reply>>(`/users/${username}/replies?${params.toString()}`);
};
