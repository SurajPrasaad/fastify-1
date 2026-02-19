import { api } from "@/lib/api-client";
import {
    ToggleLikePayload,
    ToggleLikeResponse,
    ToggleBookmarkResponse,
    CreateCommentPayload,
    Comment
} from "./types";

export const interactionApi = {
    /**
     * Toggle like on a post or comment
     */
    async toggleLike(payload: ToggleLikePayload): Promise<ToggleLikeResponse> {
        return api.post("/interaction/like", payload);
    },

    /**
     * Toggle bookmark status for a post
     */
    async toggleBookmark(postId: string): Promise<ToggleBookmarkResponse> {
        return api.post(`/interaction/bookmark/${postId}`);
    },

    /**
     * Create a new comment or reply
     */
    async createComment(payload: CreateCommentPayload): Promise<Comment> {
        const c = await api.post<any>("/interaction/comment", payload);
        return {
            ...c,
            stats: {
                likes: c.stats?.likes || 0,
                replies: c.stats?.replies || 0
            }
        };
    },

    /**
     * Fetch root comments for a post
     */
    async getComments(postId: string, cursor?: string, limit: number = 20): Promise<Comment[]> {
        const query = new URLSearchParams();
        if (cursor) query.set("cursor", cursor);
        query.set("postId", postId);
        query.set("limit", limit.toString());

        const response = await api.get<{ data: any[] }>(`/interaction/post/${postId}/comments?${query.toString()}`);

        return response.data.map(c => ({
            ...c,
            stats: {
                likes: c.stats?.likes || 0,
                replies: c.stats?.replies || 0
            }
        }));
    },

    /**
     * Fetch replies for a specific comment
     */
    async getReplies(parentId: string, cursor?: string, limit: number = 20): Promise<Comment[]> {
        const query = new URLSearchParams();
        if (cursor) query.set("cursor", cursor);
        query.set("parentId", parentId);
        query.set("limit", limit.toString());

        const response = await api.get<{ data: any[] }>(`/interaction/comment/${parentId}/replies?${query.toString()}`);

        return response.data.map(c => ({
            ...c,
            stats: {
                likes: c.stats?.likes || 0,
                replies: c.stats?.replies || 0
            }
        }));
    }
};
