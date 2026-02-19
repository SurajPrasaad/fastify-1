import type { ResourceType } from "./interaction.dto.js";
export declare class InteractionRepository {
    /**
     * Toggles a like on a Post or Comment within a transaction.
     */
    toggleLike(userId: string, resourceId: string, resourceType: ResourceType): Promise<{
        liked: boolean;
    }>;
    /**
     * Fetches root comments for a post (parent_id is NULL) with cursor pagination.
     */
    getRootComments(postId: string, limit: number, cursor?: string): Promise<{
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
     * Fetches replies for a specific comment.
     */
    getReplies(parentId: string, limit: number, cursor?: string): Promise<{
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
     * Creates a new comment or reply.
     */
    createComment(userId: string, postId: string, content: string, parentId?: string): Promise<{
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
     * Toggles a bookmark for a post.
     */
    toggleBookmark(userId: string, postId: string): Promise<{
        bookmarked: boolean;
    }>;
    /**
     * Validates if the original post exists for a repost.
     */
    validatePostExists(postId: string): Promise<boolean>;
}
//# sourceMappingURL=interaction.repository.d.ts.map