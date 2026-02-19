import { api } from "@/lib/api-client";
import { Post, ApiPost, PaginatedResult } from "./types";

export const mapApiPostToPost = (apiPost: ApiPost): Post => {
    // Basic media type detection
    const mapMedia = (url: string) => {
        const ext = url.split('.').pop()?.toLowerCase();
        const isVideo = ['mp4', 'webm', 'mov'].includes(ext || '');
        return {
            type: (isVideo ? 'video' : 'image') as 'image' | 'video',
            url
        };
    };

    return {
        id: apiPost.id,
        userId: apiPost.userId,
        author: {
            username: apiPost.author?.username || "Unknown",
            displayName: apiPost.author?.name || "Unknown",
            avatarUrl: apiPost.author?.avatarUrl,
        },
        content: apiPost.content,
        media: apiPost.mediaUrls?.map(mapMedia) || [],
        stats: {
            likes: apiPost.likesCount || 0,
            comments: apiPost.commentsCount || 0,
            shares: 0 // Backend doesn't support shares yet
        },
        createdAt: new Date(apiPost.createdAt),
        isLiked: apiPost.isLiked,
        isBookmarked: apiPost.isBookmarked,
    };
};

export const getMyPosts = async (limit = 10, cursor?: string): Promise<PaginatedResult<Post>> => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append("cursor", cursor);

    const response = await api.get<PaginatedResult<ApiPost>>(`/users/me/posts?${params.toString()}`);

    return {
        ...response,
        data: response.data.map(mapApiPostToPost)
    };
};
