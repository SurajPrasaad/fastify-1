
import { redis } from "../../config/redis.js";
import { InteractionRepository } from "./interaction.repository.js";
import type { ResourceType, CreateCommentInput } from "./interaction.dto.js";
import { db } from "../../config/drizzle.js";
import { posts, comments } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import {
    triggerLikeNotification,
    triggerCommentLikeNotification,
    triggerCommentNotification,
    triggerReplyNotification,
    triggerMentionNotifications,
} from "../notification/notification.triggers.js";

export class InteractionService {
    constructor(private repo: InteractionRepository = new InteractionRepository()) { }

    /**
     * Toggles a like and updates Redis cache for fast "Is Liked" checks.
     */
    async toggleLike(userId: string, resourceId: string, resourceType: ResourceType, action?: "LIKE" | "UNLIKE") {
        const result = await this.repo.toggleLike(userId, resourceId, resourceType, action);

        // Write-Through Cache Strategy
        const cacheKey = `user:likes:${userId}`;
        const member = `${resourceType}:${resourceId}`;

        if (result.liked) {
            await redis.sadd(cacheKey, member);

            // 🔔 Fire LIKE notification
            if (resourceType === "POST") {
                const [post] = await db
                    .select({ userId: posts.userId, content: posts.content })
                    .from(posts)
                    .where(eq(posts.id, resourceId))
                    .limit(1);
                if (post) {
                    triggerLikeNotification(userId, post.userId, resourceId, post.content);
                }
            } else if (resourceType === "COMMENT") {
                const [comment] = await db
                    .select({ userId: comments.userId, postId: comments.postId, content: comments.content })
                    .from(comments)
                    .where(eq(comments.id, resourceId))
                    .limit(1);
                if (comment) {
                    triggerCommentLikeNotification(userId, comment.userId, resourceId, comment.postId, comment.content);
                }
            }
        } else {
            await redis.srem(cacheKey, member);
        }

        return result;
    }

    /**
     * Fetches the top-level comments for a post.
     */
    async getPostComments(postId: string, limit: number, cursor?: string, userId?: string) {
        return await this.repo.getRootComments(postId, limit, cursor, userId);
    }

    /**
     * Fetches replies for a comment.
     */
    async getCommentReplies(parentId: string, limit: number, cursor?: string, userId?: string) {
        return await this.repo.getReplies(parentId, limit, cursor, userId);
    }

    /**
     * Fetches all replies (comments) created by a user.
     */
    async getUserReplies(userId: string, limit: number, cursor?: string, currentUserId?: string) {
        return await this.repo.getUserReplies(userId, limit, cursor, currentUserId);
    }

    /**
     * Adds a new comment or reply.
     */
    async addComment(userId: string, input: CreateCommentInput) {
        const comment = await this.repo.createComment(
            userId,
            input.postId,
            input.content,
            input.parentId
        );

        if (comment) {
            if (input.parentId) {
                // 🔔 REPLY notification → notify parent comment owner
                const [parentComment] = await db
                    .select({ userId: comments.userId })
                    .from(comments)
                    .where(eq(comments.id, input.parentId))
                    .limit(1);
                if (parentComment) {
                    triggerReplyNotification(
                        userId,
                        parentComment.userId,
                        input.postId,
                        comment.id,
                        input.parentId,
                        input.content
                    );
                }
            } else {
                // 🔔 COMMENT notification → notify post owner
                const [post] = await db
                    .select({ userId: posts.userId })
                    .from(posts)
                    .where(eq(posts.id, input.postId))
                    .limit(1);
                if (post) {
                    triggerCommentNotification(
                        userId,
                        post.userId,
                        input.postId,
                        comment.id,
                        input.content
                    );
                }
            }

            // 🔔 MENTION notifications for @username in content
            triggerMentionNotifications(userId, input.content, input.postId, comment.id);
        }

        return comment;
    }

    /**
     * Fetches all posts liked by a user.
     */
    async getUserLikedPosts(userId: string, limit: number, cursor?: string) {
        return await this.repo.getUserLikedPosts(userId, limit, cursor);
    }

    /**
     * Toggles a bookmark.
     */
    async toggleBookmark(userId: string, postId: string) {
        return await this.repo.toggleBookmark(userId, postId);
    }

    /**
     * Fetches all posts bookmarked by a user.
     */
    async getUserBookmarks(userId: string, limit: number, cursor?: string) {
        return await this.repo.getUserBookmarks(userId, limit, cursor);
    }

    /**
     * Reposts a post by creating a new post entry referencing the original.
     */
    async createRepost(userId: string, originalPostId: string, content?: string) {
        const exists = await this.repo.validatePostExists(originalPostId);
        if (!exists) {
            throw new Error("Original post does not exist");
        }

        const repost = await this.repo.createRepost(userId, originalPostId, content);
        if (!repost) {
            throw new Error("Failed to create repost");
        }

        // 🔔 Optional: Trigger Repost Notification
        // In a real app, you'd notify the owner of originalPostId

        return repost;
    }
}
