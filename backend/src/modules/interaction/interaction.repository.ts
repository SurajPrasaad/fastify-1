
import { db } from "../../config/drizzle.js";
import { likes, comments, posts, users, bookmarks, reposts, userCounters } from "../../db/schema.js";
import { and, desc, eq, sql, lt, count, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { ResourceType } from "./interaction.dto.js";

export class InteractionRepository {
    /**
     * Toggles a like on a Post or Comment within a transaction.
     */
    async toggleLike(userId: string, resourceId: string, resourceType: ResourceType, action?: "LIKE" | "UNLIKE") {
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
                if (action === "LIKE") {
                    return { liked: true, count: await this.getLikesCount(tx, resourceId, resourceType) };
                }

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

                let count = 0;
                if (resourceType === "POST") {
                    const [updated] = await tx
                        .update(posts)
                        .set({ likesCount: sql`${posts.likesCount} - 1` })
                        .where(eq(posts.id, resourceId))
                        .returning({ count: posts.likesCount });
                    count = updated?.count || 0;
                } else {
                    const [updated] = await tx
                        .update(comments)
                        .set({ likesCount: sql`${comments.likesCount} - 1` })
                        .where(eq(comments.id, resourceId))
                        .returning({ count: comments.likesCount });
                    count = updated?.count || 0;
                }

                return { liked: false, count };
            } else {
                if (action === "UNLIKE") {
                    return { liked: false, count: await this.getLikesCount(tx, resourceId, resourceType) };
                }

                // Like: Insert row and increment counter
                await tx.insert(likes).values({
                    userId,
                    targetId: resourceId,
                    targetType: resourceType,
                });

                let count = 0;
                if (resourceType === "POST") {
                    const [updated] = await tx
                        .update(posts)
                        .set({ likesCount: sql`${posts.likesCount} + 1` })
                        .where(eq(posts.id, resourceId))
                        .returning({ count: posts.likesCount });
                    count = updated?.count || 0;
                } else {
                    const [updated] = await tx
                        .update(comments)
                        .set({ likesCount: sql`${comments.likesCount} + 1` })
                        .where(eq(comments.id, resourceId))
                        .returning({ count: comments.likesCount });
                    count = updated?.count || 0;
                }

                return { liked: true, count };
            }
        });
    }

    /**
     * Helper to get the current likes count for a resource.
     */
    private async getLikesCount(tx: any, resourceId: string, resourceType: ResourceType): Promise<number> {
        if (resourceType === "POST") {
            const result = await tx.select({ count: posts.likesCount }).from(posts).where(eq(posts.id, resourceId)).limit(1);
            return result[0]?.count || 0;
        } else {
            const result = await tx.select({ count: comments.likesCount }).from(comments).where(eq(comments.id, resourceId)).limit(1);
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
     * Fetches posts bookmarked by a user with cursor pagination.
     */
    async getUserBookmarks(userId: string, limit: number, cursor?: string) {
        const postAuthor = alias(users, "postAuthor");

        const query = db
            .select({
                post: posts,
                author: {
                    username: postAuthor.username,
                    name: postAuthor.name,
                    avatarUrl: postAuthor.avatarUrl,
                },
                bookmarkedAt: bookmarks.createdAt,
                isLiked: sql<boolean>`EXISTS (SELECT 1 FROM likes WHERE target_id = ${posts.id} AND user_id = ${userId} AND target_type = 'POST')`,
            })
            .from(bookmarks)
            .innerJoin(posts, eq(bookmarks.postId, posts.id))
            .innerJoin(postAuthor, eq(posts.userId, postAuthor.id))
            .where(
                and(
                    eq(bookmarks.userId, userId),
                    cursor ? lt(bookmarks.createdAt, new Date(cursor)) : undefined
                )
            )
            .orderBy(desc(bookmarks.createdAt))
            .limit(limit);

        const results = await query;

        return results.map(r => ({
            ...r.post,
            author: r.author,
            isLiked: r.isLiked,
            isBookmarked: true,
            bookmarkedAt: r.bookmarkedAt,
        }));
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

    /**
     * Creates a repost. 
     * If content is provided, it's a quote post.
     * Otherwise, it's a simple repost.
     */
    async createRepost(userId: string, originalPostId: string, content?: string) {
        return await db.transaction(async (tx) => {
            // 1. Fetch original post for content
            const [originalPost] = await tx
                .select()
                .from(posts)
                .where(eq(posts.id, originalPostId))
                .limit(1);

            if (!originalPost) {
                throw new Error("Original post not found");
            }

            // 2. Create entry in reposts table for tracking
            await tx.insert(reposts).values({
                userId,
                postId: originalPostId,
                quoteText: content || null,
            });

            // 3. Create a new post entry with originalPostId set
            // Use original content if it's a simple repost
            const [newPost] = await tx.insert(posts).values({
                userId,
                content: content || originalPost.content,
                originalPostId,
                status: "PUBLISHED",
                publishedAt: new Date(),
            }).returning();

            if (!newPost) {
                throw new Error("Failed to create repost");
            }

            // 4. Increment repostsCount on the original post
            await tx
                .update(posts)
                .set({
                    repostsCount: sql`${posts.repostsCount} + 1`,
                    updatedAt: new Date()
                })
                .where(eq(posts.id, originalPostId));

            // 5. Increment user post count
            await tx
                .update(userCounters)
                .set({ postsCount: sql`${userCounters.postsCount} + 1`, updatedAt: new Date() })
                .where(eq(userCounters.userId, userId));

            // 6. Fetch hydrated post to return to frontend
            const [hydrated] = await tx
                .select({
                    id: posts.id,
                    userId: posts.userId,
                    content: posts.content,
                    originalPostId: posts.originalPostId,
                    commentsCount: posts.commentsCount,
                    likesCount: posts.likesCount,
                    repostsCount: posts.repostsCount,
                    createdAt: posts.createdAt,
                    mediaUrls: posts.mediaUrls,
                    author: {
                        username: users.username,
                        name: users.name,
                        avatarUrl: users.avatarUrl,
                    }
                })
                .from(posts)
                .innerJoin(users, eq(posts.userId, users.id))
                .where(eq(posts.id, newPost.id))
                .limit(1);

            // 6. Fetch original post data for the nested reference
            const [origDetails] = await tx
                .select({
                    id: posts.id,
                    content: posts.content,
                    createdAt: posts.createdAt,
                    mediaUrls: posts.mediaUrls,
                    author: {
                        username: users.username,
                        name: users.name,
                        avatarUrl: users.avatarUrl,
                    }
                })
                .from(posts)
                .innerJoin(users, eq(posts.userId, users.id))
                .where(eq(posts.id, originalPostId))
                .limit(1);

            return {
                ...hydrated,
                originalPost: origDetails || null,
                originalPostUserId: originalPost.userId
            };
        });
    }
}
