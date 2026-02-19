export interface ReplyPostAuthor {
    id: string;
    username: string;
    avatarUrl: string | null;
}

export interface ReplyPost {
    id: string;
    content: string;
    author: ReplyPostAuthor;
}

export interface ReplyAuthor {
    username: string;
    name: string;
    avatarUrl: string | null;
}

export interface ReplyStats {
    likes: number;
}

export interface Reply {
    id: string;
    postId: string;
    userId: string;
    parentId: string | null;
    content: string;
    createdAt: string;
    author: ReplyAuthor;
    post: ReplyPost;
    stats: ReplyStats;
    isLiked: boolean;
}

export interface PaginatedResult<T> {
    data: T[];
    meta: {
        nextCursor: string | null;
        hasNext: boolean;
    };
}
