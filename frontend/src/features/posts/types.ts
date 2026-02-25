export interface PostAuthor {
    username: string;
    name: string;
    avatarUrl?: string;
    isVerified?: boolean;
}

export interface PostMedia {
    type: "image" | "video";
    url: string;
    aspectRatio?: number;
}

export interface PostStats {
    likes: number;
    comments: number;
    reposts: number;
}

export interface Post {
    id: string;
    userId: string;
    author: PostAuthor;
    content: string;
    media?: PostMedia[];
    stats: PostStats;
    createdAt: Date;
    isLiked?: boolean;
    isBookmarked?: boolean;
}

export interface ApiPost {
    id: string;
    userId: string;
    content: string;
    mediaUrls: string[];
    commentsCount: number;
    likesCount: number;
    repostsCount: number;
    createdAt: string; // ISO string from API
    author?: {
        username: string;
        name: string;
        avatarUrl?: string;
    };
    isLiked?: boolean;
    isBookmarked?: boolean;
}

export interface PaginatedResult<T> {
    data: T[];
    meta: {
        nextCursor: string | null;
        hasNext: boolean;
    };
}
