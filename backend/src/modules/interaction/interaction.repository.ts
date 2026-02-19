
import { db } from "../../config/drizzle.js";
import { likes, comments, posts, users, bookmarks } from "../../db/schema.js";
import { and, desc, eq, sql, lt, count, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { ResourceType } from "./interaction.dto.js";

export class InteractionRepository {
    /**
     * Toggles a like on a Post or Comment within a transaction.
     */
    async toggleLike(userId: string, resourceId: string, resourceType: ResourceType) {
        return await db.transaction(async (tx) => {
            // Check if like exists
            const existingLike = await tx
                .select()
                .from(likes)
                .where(
                    and(
                        eq(likes.userId, userId),
                        eq(likes.targetId, resourceId),
                        eq(likes.targetType, resourceType)
                    )
                )
                .limit(1);

            if (existingLike.length > 0) {
                // Unlike: Delete row and decrement counter
                await tx
                    .delete(likes)
                    .where(
                        and(
                            eq(likes.userId, userId),
                            eq(likes.targetId, resourceId),
                            eq(likes.targetType, resourceType)
                        )
                    );

                if (resourceType === "POST") {
                    await tx
                        .update(posts)
                        .set({ likesCount: sql`${posts.likesCount} - 1` })
                        .where(eq(posts.id, resourceId));
                } else {
                    await tx
                        .update(comments)
                        .set({ likesCount: sql`${comments.likesCount} - 1` })
                        .where(eq(comments.id, resourceId));
                }

                return { liked: false, count: await this.getLikesCount(resourceId, resourceType) };
            } else {
                // Like: Insert row and increment counter
                await tx.insert(likes).values({
                    userId,
                    targetId: resourceId,
                    targetType: resourceType,
                });

                if (resourceType === "POST") {
                    await tx
                        .update(posts)
                        .set({ likesCount: sql`${posts.likesCount} + 1` })
                        .where(eq(posts.id, resourceId));
                } else {
                    await tx
                        .update(comments)
                        .set({ likesCount: sql`${comments.likesCount} + 1` })
                        .where(eq(comments.id, resourceId));
                }

                return { liked: true, count: await this.getLikesCount(resourceId, resourceType) };
            }
        });
    }

    /**
     * Helper to get the current likes count for a resource.
     */
    private async getLikesCount(resourceId: string, resourceType: ResourceType): Promise<number> {
        if (resourceType === "POST") {
            const result = await db.select({ count: posts.likesCount }).from(posts).where(eq(posts.id, resourceId)).limit(1);
            return result[0]?.count || 0;
        } else {
            const result = await db.select({ count: comments.likesCount }).from(comments).where(eq(comments.id, resourceId)).limit(1);
            return result[0]?.count || 0;
        }
    }

    /**
     * Fetches root comments for a post (parent_id is NULL) with cursor pagination.
     */
    async getRootComments(postId: string, limit: number, cursor?: string, currentUserId?: string) {
        const query = db
            .select({
                id: comments.id,
                postId: comments.postId,
                userId: comments.userId,
                parentId: comments.parentId,
                content: comments.content,
                createdAt: comments.createdAt,
                author: {
                    username: users.username,
                    name: users.name,
                    avatarUrl: users.avatarUrl,
                },
                stats: {
                    likes: comments.likesCount,
                    replies: sql<number>`(SELECT COUNT(*) FROM comments c2 WHERE c2.parent_id = ${comments.id})`.mapWith(Number),
                },
                isLiked: currentUserId
                    ? sql<boolean>`EXISTS (SELECT 1 FROM likes WHERE target_id = ${comments.id} AND user_id = ${currentUserId} AND target_type = 'COMMENT')`
                    : sql<boolean>`false`,
            })
            .from(comments)
            .innerJoin(users, eq(comments.userId, users.id))
            .where(
                and(
                    eq(comments.postId, postId),
                    isNull(comments.parentId),
                    cursor ? lt(comments.createdAt, new Date(cursor)) : undefined
                )
            )
            .orderBy(desc(comments.createdAt))
            .limit(limit);

        return await query;
    }

    /**
     * Fetches replies for a specific comment.
     */
    async getReplies(parentId: string, limit: number, cursor?: string, currentUserId?: string) {
        return await db
            .select({
                id: comments.id,
                postId: comments.postId,
                userId: comments.userId,
                parentId: comments.parentId,
                content: comments.content,
                createdAt: comments.createdAt,
                author: {
                    username: users.username,
                    name: users.name,
                    avatarUrl: users.avatarUrl,
                },
                stats: {
                    likes: comments.likesCount,
                    replies: sql<number>`(SELECT COUNT(*) FROM comments c2 WHERE c2.parent_id = ${comments.id})`.mapWith(Number),
                },
                isLiked: currentUserId
                    ? sql<boolean>`EXISTS (SELECT 1 FROM likes WHERE target_id = ${comments.id} AND user_id = ${currentUserId} AND target_type = 'COMMENT')`
                    : sql<boolean>`false`,
            })
            .from(comments)
            .innerJoin(users, eq(comments.userId, users.id))
            .where(
                and(
                    eq(comments.parentId, parentId),
                    cursor ? lt(comments.createdAt, new Date(cursor)) : undefined
                )
            )
            .orderBy(desc(comments.createdAt))
            .limit(limit);
    }

    /**
     * Creates a new comment or reply.
     */
    async createComment(userId: string, postId: string, content: string, parentId?: string) {
        return await db.transaction(async (tx) => {
            const [newComment] = await tx
                .insert(comments)
                .values({
                    userId,
                    postId,
                    content,
                    parentId: parentId || null,
                })
                .returning();

            if (!newComment) {
                throw new Error("Failed to create comment");
            }

            // Increment comments counter on post
            await tx
                .update(posts)
                .set({ commentsCount: sql`${posts.commentsCount} + 1` })
                .where(eq(posts.id, postId));

            // Fetch the created comment with author info
            const [commentWithAuthor] = await tx
                .select({
                    id: comments.id,
                    postId: comments.postId,
                    userId: comments.userId,
                    parentId: comments.parentId,
                    content: comments.content,
                    createdAt: comments.createdAt,
                    author: {
                        username: users.username,
                        name: users.name,
                        avatarUrl: users.avatarUrl,
                    },
                    stats: {
                        likes: comments.likesCount,
                        replies: sql<number>`(SELECT COUNT(*) FROM comments c2 WHERE c2.parent_id = ${comments.id})`.mapWith(Number),
                    },
                })
                .from(comments)
                .innerJoin(users, eq(comments.userId, users.id))
                .where(eq(comments.id, newComment.id))
                .limit(1);

            return commentWithAuthor;
        });
    }

    /**
     * Toggles a bookmark for a post.
     */
    async toggleBookmark(userId: string, postId: string) {
        return await db.transaction(async (tx) => {
            const existing = await tx
                .select()
                .from(bookmarks)
                .where(and(eq(bookmarks.userId, userId), eq(bookmarks.postId, postId)))
                .limit(1);

            if (existing.length > 0) {
                await tx
                    .delete(bookmarks)
                    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.postId, postId)));
                return { bookmarked: false };
            } else {
                await tx.insert(bookmarks).values({ userId, postId });
                return { bookmarked: true };
            }
        });
    }

    /**
     * Fetches all comments (replies) made by a user.
     */
    async getUserReplies(userId: string, limit: number, cursor?: string, currentUserId?: string) {
        const postAuthor = alias(users, "postAuthor");

        const query = db
            .select({
                commentId: comments.id,
                commentPostId: comments.postId,
                commentUserId: comments.userId,
                commentParentId: comments.parentId,
                commentContent: comments.content,
                commentCreatedAt: comments.createdAt,
                authorUsername: users.username,
                authorName: users.name,
                authorAvatarUrl: users.avatarUrl,
                postId: posts.id,
                postContent: posts.content,
                postAuthorId: postAuthor.id,
                postAuthorUsername: postAuthor.username,
                postAuthorAvatarUrl: postAuthor.avatarUrl,
                likesCount: comments.likesCount,
                isLiked: currentUserId
                    ? sql<boolean>`EXISTS (SELECT 1 FROM likes WHERE target_id = ${comments.id} AND user_id = ${currentUserId} AND target_type = 'COMMENT')`
                    : sql<boolean>`false`,
            })
            .from(comments)
            .innerJoin(users, eq(comments.userId, users.id)) // Author of the reply
            .innerJoin(posts, eq(comments.postId, posts.id)) // The post being replied to
            .innerJoin(postAuthor, eq(posts.userId, postAuthor.id)) // Author of the original post
            .where(
                and(
                    eq(comments.userId, userId),
                    cursor ? lt(comments.createdAt, new Date(cursor)) : undefined
                )
            )
            .orderBy(desc(comments.createdAt))
            .limit(limit);

        const results = await query;

        return results.map(r => ({
            id: r.commentId,
            postId: r.commentPostId,
            userId: r.commentUserId,
            parentId: r.commentParentId,
            content: r.commentContent,
            createdAt: r.commentCreatedAt,
            author: {
                username: r.authorUsername,
                name: r.authorName,
                avatarUrl: r.authorAvatarUrl,
            },
            post: {
                id: r.postId,
                content: r.postContent,
                author: {
                    id: r.postAuthorId,
                    username: r.postAuthorUsername,
                    avatarUrl: r.postAuthorAvatarUrl,
                }
            },
            stats: {
                likes: r.likesCount,
            },
            isLiked: r.isLiked,
        }));
    }

    /**
     * Fetches posts liked by a user.
     */
    async getUserLikedPosts(userId: string, limit: number, cursor?: string) {
        const postAuthor = alias(users, "postAuthor");

        const query = db
            .select({
                post: posts,
                author: {
                    username: postAuthor.username,
                    name: postAuthor.name,
                    avatarUrl: postAuthor.avatarUrl,
                },
                likedAt: likes.createdAt,
                isBookmarked: sql<boolean>`EXISTS (SELECT 1 FROM bookmarks WHERE post_id = ${posts.id} AND user_id = ${userId})`
            })
            .from(likes)
            .innerJoin(posts, eq(likes.targetId, posts.id))
            .innerJoin(postAuthor, eq(posts.userId, postAuthor.id))
            .where(
                and(
                    eq(likes.userId, userId),
                    eq(likes.targetType, 'POST'),
                    cursor ? lt(likes.createdAt, new Date(cursor)) : undefined
                )
            )
            .orderBy(desc(likes.createdAt))
            .limit(limit);

        const results = await query;

        return results.map(r => ({
            ...r.post,
            author: r.author,
            isLiked: true,
            isBookmarked: r.isBookmarked,
            likedAt: r.likedAt
        }));
    }

    /**
     * Validates if the original post exists for a repost.
     */
    async validatePostExists(postId: string) {
        const result = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
        return result.length > 0;
    }
}
