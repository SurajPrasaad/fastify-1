
import { api } from '@/lib/api-client';
import {
    FeedResponse,
    CommentResponse,
    ResourceType,
    ReactionType,
    IEngagementStats,
    IComment
} from './types';

export const FeedService = {
    fetchHomeFeed: async (limit = 20, cursor?: string) => {
        const params = new URLSearchParams({ limit: limit.toString() });
        if (cursor) params.set('cursor', cursor);
        return api.get<FeedResponse>(`/feed?${params.toString()}`);
    },

    fetchExploreFeed: async (limit = 20, cursor?: string) => {
        const params = new URLSearchParams({ limit: limit.toString() });
        if (cursor) params.set('cursor', cursor);
        return api.get<FeedResponse>(`/feed/explore?${params.toString()}`);
    }
};

export const EngagementService = {
    fetchStats: async (targetId: string) => {
        return api.get<IEngagementStats>(`/engagement/stats/${targetId}`);
    },

    toggleLike: async (targetId: string, targetType: ResourceType) => {
        // Both modules support this, interaction/like is more modern in this codebase
        return api.post<{ isLiked: boolean; likeCount: number }>(`/interactions/like`, {
            resourceId: targetId,
            resourceType: targetType
        });
    },

    react: async (targetId: string, targetType: ResourceType, type: ReactionType) => {
        return api.post(`/engagement/react`, { targetId, targetType, type });
    },

    toggleBookmark: async (postId: string) => {
        return api.post<{ isBookmarked: boolean }>(`/interactions/bookmark/${postId}`);
    },

    repost: async (postId: string, content?: string) => {
        return api.post(`/engagement/repost`, { postId, quote: content });
    }
};

export const InteractionService = {
    fetchComments: async (postId: string, limit = 20, cursor?: string, parentId?: string): Promise<CommentResponse> => {
        const query = new URLSearchParams({
            postId,
            limit: limit.toString()
        });
        if (cursor) query.set('cursor', cursor);
        if (parentId) query.set('parentId', parentId);

        const response = await api.get<{ comments: any[], nextCursor?: string }>(`/comments/${postId}?${query.toString()}`);

        return {
            data: response.comments.map(c => ({
                ...c,
                likeCount: c.likesCount || 0,
                replyCount: c.repliesCount || 0
            })),
            nextCursor: response.nextCursor || undefined,
            hasMore: !!response.nextCursor
        };
    },

    fetchReplies: async (postId: string, parentId: string, limit = 20, cursor?: string): Promise<CommentResponse> => {
        return InteractionService.fetchComments(postId, limit, cursor, parentId);
    },

    addComment: async (postId: string, content: string, parentId?: string): Promise<IComment> => {
        const response = await api.post<any>(`/comments/${postId}`, { content, parentId });
        return {
            ...response,
            likeCount: response.likesCount || 0,
            replyCount: response.repliesCount || 0
        };
    },

    fetchUserLikedPosts: async (limit = 20, cursor?: string) => {
        const params = new URLSearchParams({ limit: limit.toString() });
        if (cursor) params.set('cursor', cursor);
        return api.get<FeedResponse>(`/interactions/user/likes?${params.toString()}`);
    }
};
