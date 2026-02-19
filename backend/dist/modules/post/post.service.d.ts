import type { PostRepository } from "./post.repository.js";
import type { CreatePostInput, UpdatePostInput } from "./post.schema.js";
export declare class PostService {
    private postRepository;
    constructor(postRepository: PostRepository);
    private extractHashtags;
    createPost(userId: string, data: CreatePostInput & {
        isDraft?: boolean;
    }): Promise<{
        id: string;
        status: "DELETED" | "DRAFT" | "PUBLISHED" | "ARCHIVED";
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        content: string;
        originalPostId: string | null;
        codeSnippet: string | null;
        language: string | null;
        mediaUrls: string[] | null;
        tags: string[] | null;
        commentsCount: number;
        likesCount: number;
        publishedAt: Date | null;
    }>;
    publishDraft(postId: string, userId: string): Promise<{
        id: string;
        userId: string;
        content: string;
        originalPostId: string | null;
        codeSnippet: string | null;
        language: string | null;
        mediaUrls: string[] | null;
        tags: string[] | null;
        status: "DELETED" | "DRAFT" | "PUBLISHED" | "ARCHIVED";
        commentsCount: number;
        likesCount: number;
        publishedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getFeed(limit: number, cursor?: string): Promise<{
        id: string;
        userId: string;
        content: string;
        codeSnippet: string | null;
        language: string | null;
        mediaUrls: string[] | null;
        status: "DELETED" | "DRAFT" | "PUBLISHED" | "ARCHIVED";
        commentsCount: number;
        likesCount: number;
        publishedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        author: {
            username: string;
            name: string;
        };
    }[]>;
    getPost(id: string, userId?: string): Promise<{
        id: string;
        userId: string;
        content: string;
        originalPostId: string | null;
        codeSnippet: string | null;
        language: string | null;
        mediaUrls: string[] | null;
        tags: string[] | null;
        status: "DELETED" | "DRAFT" | "PUBLISHED" | "ARCHIVED";
        commentsCount: number;
        likesCount: number;
        publishedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updatePost(id: string, userId: string, data: UpdatePostInput): Promise<{
        id: string;
        userId: string;
        content: string;
        originalPostId: string | null;
        codeSnippet: string | null;
        language: string | null;
        mediaUrls: string[] | null;
        tags: string[] | null;
        status: "DELETED" | "DRAFT" | "PUBLISHED" | "ARCHIVED";
        commentsCount: number;
        likesCount: number;
        publishedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    archivePost(id: string, userId: string): Promise<{
        id: string;
        userId: string;
        content: string;
        originalPostId: string | null;
        codeSnippet: string | null;
        language: string | null;
        mediaUrls: string[] | null;
        tags: string[] | null;
        status: "DELETED" | "DRAFT" | "PUBLISHED" | "ARCHIVED";
        commentsCount: number;
        likesCount: number;
        publishedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deletePost(id: string, userId: string): Promise<{
        id: string;
        userId: string;
        content: string;
        originalPostId: string | null;
        codeSnippet: string | null;
        language: string | null;
        mediaUrls: string[] | null;
        tags: string[] | null;
        status: "DELETED" | "DRAFT" | "PUBLISHED" | "ARCHIVED";
        commentsCount: number;
        likesCount: number;
        publishedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getUploadSignature(): Promise<{
        signature: string;
        timestamp: number;
        apiKey: string | undefined;
        cloudName: string | undefined;
    }>;
}
//# sourceMappingURL=post.service.d.ts.map