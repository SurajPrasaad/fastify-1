import { db } from "../../config/drizzle.js";
import { likes, comments, posts, users, bookmarks } from "../../db/schema.js";
import { and, desc, eq, sql, lt, count } from "drizzle-orm";
export class InteractionRepository {
    /**
     * Toggles a like on a Post or Comment within a transaction.
     */
    async toggleLike(userId, resourceId, resourceType) {
        return await db.transaction(async (tx) => {
            // Check if like exists
            const existingLike = await tx
                .select()
                .from(likes)
                .where(and(eq(likes.userId, userId), eq(likes.targetId, resourceId), eq(likes.targetType, resourceType)))
                .limit(1);
            if (existingLike.length > 0) {
                // Unlike: Delete row and decrement counter
                await tx
                    .delete(likes)
                    .where(and(eq(likes.userId, userId), eq(likes.targetId, resourceId), eq(likes.targetType, resourceType)));
                if (resourceType === "POST") {
                    await tx
                        .update(posts)
                        .set({ likesCount: sql `${posts.likesCount} - 1` })
                        .where(eq(posts.id, resourceId));
                }
                else {
                    await tx
                        .update(comments)
                        .set({ likesCount: sql `${comments.likesCount} - 1` })
                        .where(eq(comments.id, resourceId));
                }
                return { liked: false };
            }
            else {
                // Like: Insert row and increment counter
                await tx.insert(likes).values({
                    userId,
                    targetId: resourceId,
                    targetType: resourceType,
                });
                if (resourceType === "POST") {
                    await tx
                        .update(posts)
                        .set({ likesCount: sql `${posts.likesCount} + 1` })
                        .where(eq(posts.id, resourceId));
                }
                else {
                    await tx
                        .update(comments)
                        .set({ likesCount: sql `${comments.likesCount} + 1` })
                        .where(eq(comments.id, resourceId));
                }
                return { liked: true };
            }
        });
    }
    /**
     * Fetches root comments for a post (parent_id is NULL) with cursor pagination.
     */
    async getRootComments(postId, limit, cursor) {
        const query = db
            .select({
            id: comments.id,
            postId: comments.postId,
            parentId: comments.parentId,
            content: comments.content,
            likesCount: comments.likesCount,
            createdAt: comments.createdAt,
            author: {
                username: users.username,
                name: users.name,
            },
        })
            .from(comments)
            .innerJoin(users, eq(comments.userId, users.id))
            .where(and(eq(comments.postId, postId), sql `${comments.parentId} IS NULL`, cursor ? lt(comments.createdAt, new Date(cursor)) : undefined))
            .orderBy(desc(comments.createdAt))
            .limit(limit);
        return await query;
    }
    /**
     * Fetches replies for a specific comment.
     */
    async getReplies(parentId, limit, cursor) {
        return await db
            .select({
            id: comments.id,
            postId: comments.postId,
            parentId: comments.parentId,
            content: comments.content,
            likesCount: comments.likesCount,
            createdAt: comments.createdAt,
            author: {
                username: users.username,
                name: users.name,
            },
        })
            .from(comments)
            .innerJoin(users, eq(comments.userId, users.id))
            .where(and(eq(comments.parentId, parentId), cursor ? lt(comments.createdAt, new Date(cursor)) : undefined))
            .orderBy(desc(comments.createdAt))
            .limit(limit);
    }
    /**
     * Creates a new comment or reply.
     */
    async createComment(userId, postId, content, parentId) {
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
            // Increment comments counter on post
            await tx
                .update(posts)
                .set({ commentsCount: sql `${posts.commentsCount} + 1` })
                .where(eq(posts.id, postId));
            return newComment;
        });
    }
    /**
     * Toggles a bookmark for a post.
     */
    async toggleBookmark(userId, postId) {
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
            }
            else {
                await tx.insert(bookmarks).values({ userId, postId });
                return { bookmarked: true };
            }
        });
    }
    /**
     * Validates if the original post exists for a repost.
     */
    async validatePostExists(postId) {
        const result = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
        return result.length > 0;
    }
}
//# sourceMappingURL=interaction.repository.js.map