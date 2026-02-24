export type ResourceType = "POST" | "COMMENT";

export interface ToggleLikePayload {
    resourceId: string;
    resourceType: ResourceType;
}

export interface Comment {
    id: string;
    postId: string;
    parentId: string | null;
    userId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    author: {
        username: string;
        name: string;
        avatarUrl: string | null;
    };
    stats: {
        likes: number;
        replies: number;
    };
    isLiked?: boolean;
}

export interface CreateCommentPayload {
    postId: string;
    parentId?: string;
    content: string;
}

export interface ToggleLikeResponse {
    liked: boolean;
    count: number;
}

export interface ToggleBookmarkResponse {
    bookmarked: boolean;
}

export interface RepostPayload {
    postId: string;
    content?: string;
}

export interface RepostResponse {
    success: boolean;
    repostId: string;
}

export interface HashtagTrend {
    id: string;
    name: string;
    postsCount: number;
    lastUsedAt: string;
}
