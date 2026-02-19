export declare const PostStatus: {
    readonly PUBLISHED: "PUBLISHED";
    readonly ARCHIVED: "ARCHIVED";
    readonly DELETED: "DELETED";
};
export type PostStatus = typeof PostStatus[keyof typeof PostStatus];
export interface CreatePostDto {
    content: string;
    codeSnippet?: string;
    language?: string;
    mediaUrls?: string[];
}
export interface UpdatePostDto {
    content?: string;
    codeSnippet?: string;
    language?: string;
    mediaUrls?: string[];
}
export interface PostDto {
    id: string;
    userId: string;
    content: string;
    codeSnippet?: string | null;
    language?: string | null;
    mediaUrls: string[];
    status: PostStatus;
    commentsCount: number;
    likesCount: number;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=post.dto.d.ts.map