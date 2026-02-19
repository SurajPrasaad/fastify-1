import type { CreatePostInput, UpdatePostInput } from "./post.schema.js";
export declare class PostRepository {
    create(data: CreatePostInput & {
        userId: string;
        status?: "DRAFT" | "PUBLISHED";
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
    } | undefined>;
    findById(id: string, includePrivate?: boolean): Promise<{
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
    } | null>;
    findMany(limit: number, cursor?: string): Promise<{
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
    update(id: string, userId: string, data: UpdatePostInput): Promise<{
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
    } | null | undefined>;
    publish(id: string, userId: string): Promise<{
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
    } | undefined>;
    archive(id: string, userId: string): Promise<{
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
    } | undefined>;
    delete(id: string, userId: string): Promise<{
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
    } | undefined>;
    linkHashtags(postId: string, hashtagNames: string[]): Promise<void>;
}
//# sourceMappingURL=post.repository.d.ts.map