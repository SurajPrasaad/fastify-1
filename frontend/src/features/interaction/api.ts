import { api } from "@/lib/api-client";
import {
    ToggleLikePayload,
    ToggleLikeResponse,
    ToggleBookmarkResponse,
    CreateCommentPayload,
    Comment,
    RepostPayload,
    RepostResponse,
    HashtagTrend
} from "./types";

export const interactionApi = {
    /**
     * Fetch trending hashtags
     */
    async getTrendingHashtags(limit: number = 10): Promise<HashtagTrend[]> {
        return api.get(`/engagement/trending?limit=${limit}`);
    },
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
        const c = await api.post<any>(`/comments/${payload.postId}`, {
            content: payload.content,
            parentId: payload.parentId
        });

        // Robust mapping of the response
        return {
            ...c,
            postId: payload.postId,
            userId: c.user?.id || c.userId,
            author: {
                username: c.user?.username || "anonymous",
                name: c.user?.name || "Anonymous",
                avatarUrl: c.user?.avatarUrl || null
            },
            stats: {
                likes: c.likesCount || c.stats?.likes || 0,
                replies: c.repliesCount || c.stats?.replies || 0
            },
            createdAt: c.createdAt || new Date().toISOString(),
            updatedAt: c.updatedAt || new Date().toISOString(),
            parentId: c.parentId || null
        };
    },

    /**
     * Fetch root comments for a post
     */
    async getComments(postId: string, cursor?: string, limit: number = 20): Promise<Comment[]> {
        const query = new URLSearchParams({
            limit: limit.toString()
        });
        if (cursor) query.set("cursor", cursor);

        const response = await api.get<{ comments: any[]; nextCursor?: string | null }>(`/comments/${postId}?${query.toString()}`);

        // Ensure comments exist as an array
        const rawComments = Array.isArray(response?.comments) ? response.comments : [];

        return rawComments.map((c: any) => ({
            ...c,
            postId,
            userId: c.user?.id || c.userId,
            author: {
                username: c.user?.username || "anonymous",
                name: c.user?.name || "Anonymous",
                avatarUrl: c.user?.avatarUrl || null
            },
            stats: {
                likes: c.likesCount || Number(c.stats?.likes) || 0,
                replies: Number(c.repliesCount) || Number(c.stats?.replies) || 0
            }
        }));
    },

    /**
     * Fetch replies for a specific comment
     */
    async getReplies(postId: string, parentId: string, cursor?: string, limit: number = 20): Promise<Comment[]> {
        const query = new URLSearchParams({
            parentId,
            limit: limit.toString()
        });
        if (cursor) query.set("cursor", cursor);

        const response = await api.get<{ comments: any[]; nextCursor?: string | null }>(`/comments/${postId}?${query.toString()}`);

        const rawComments = Array.isArray(response?.comments) ? response.comments : [];

        return rawComments.map((c: any) => ({
            ...c,
            postId,
            userId: c.user?.id || c.userId,
            author: {
                username: c.user?.username || "anonymous",
                name: c.user?.name || "Anonymous",
                avatarUrl: c.user?.avatarUrl || null
            },
            stats: {
                likes: c.likesCount || Number(c.stats?.likes) || 0,
                replies: Number(c.repliesCount) || Number(c.stats?.replies) || 0
            }
        }));
    },

    /**
     * Repost or quote a post
     */
    async repost(payload: RepostPayload): Promise<RepostResponse> {
        return api.post("/interaction/repost", payload);
    }
};
