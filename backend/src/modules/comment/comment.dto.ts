
export interface CommentDto {
    id: string;
    user: {
        id: string;
        username: string;
        name: string;
    };
    content: string;
    likesCount: number;
    createdAt: Date;
    updatedAt: Date;
    repliesCount?: number;
    parentId?: string | null;
}

export interface CreateCommentDto {
    postId: string;
    content: string;
    parentId?: string | undefined;
}

export interface GetCommentsDto {
    postId: string;
    limit?: number | undefined;
    cursor?: string | undefined; // createdAt timestamp
    parentId?: string | undefined; // For fetching replies
}

export interface CommentResponse {
    comments: CommentDto[];
    nextCursor?: string | null;
}
