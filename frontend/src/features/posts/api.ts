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
            name: apiPost.author?.name || "Unknown",
            avatarUrl: apiPost.author?.avatarUrl,
        },
        content: apiPost.content,
        media: apiPost.mediaUrls?.map(mapMedia) || [],
        stats: {
            likes: apiPost.likesCount || 0,
            comments: apiPost.commentsCount || 0,
            reposts: apiPost.repostsCount || 0
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

export const getUserPosts = async (username: string, limit = 10, cursor?: string): Promise<PaginatedResult<Post>> => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append("cursor", cursor);

    const response = await api.get<PaginatedResult<ApiPost>>(`/users/${username}/posts?${params.toString()}`);

    return {
        ...response,
        data: response.data.map(mapApiPostToPost)
    };
};
export const updatePost = async (id: string, data: any): Promise<Post> => {
    const response = await api.put<ApiPost>(`/posts/${id}`, data);
    return mapApiPostToPost(response);
};

export const deletePost = async (id: string): Promise<void> => {
    await api.delete(`/posts/${id}`);
};
