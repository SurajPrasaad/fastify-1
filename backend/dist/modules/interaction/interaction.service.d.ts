import { InteractionRepository } from "./interaction.repository.js";
import type { ResourceType, CreateCommentInput } from "./interaction.dto.js";
export declare class InteractionService {
    private repo;
    constructor(repo?: InteractionRepository);
    /**
     * Toggles a like and updates Redis cache for fast "Is Liked" checks.
     */
    toggleLike(userId: string, resourceId: string, resourceType: ResourceType): Promise<{
        liked: boolean;
    }>;
    /**
     * Fetches the top-level comments for a post.
     */
    getPostComments(postId: string, limit: number, cursor?: string): Promise<{
        id: string;
        postId: string;
        parentId: string | null;
        content: string;
        likesCount: number;
        createdAt: Date;
        author: {
            username: string;
            name: string;
        };
    }[]>;
    /**
     * Fetches replies for a comment.
     */
    getCommentReplies(parentId: string, limit: number, cursor?: string): Promise<{
        id: string;
        postId: string;
        parentId: string | null;
        content: string;
        likesCount: number;
        createdAt: Date;
        author: {
            username: string;
            name: string;
        };
    }[]>;
    /**
     * Adds a new comment or reply.
     */
    addComment(userId: string, input: CreateCommentInput): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        content: string;
        likesCount: number;
        postId: string;
        parentId: string | null;
    } | undefined>;
    /**
     * Toggles a bookmark.
     */
    toggleBookmark(userId: string, postId: string): Promise<{
        bookmarked: boolean;
    }>;
    /**
     * Reposts a post by creating a new post entry referencing the original.
     */
    createRepost(userId: string, originalPostId: string, content: string): Promise<{
        success: boolean;
        originalPostId: string;
        userId: string;
    }>;
}
//# sourceMappingURL=interaction.service.d.ts.map