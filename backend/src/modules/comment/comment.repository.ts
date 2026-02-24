
import { db } from "../../config/drizzle.js";
import { comments, posts, users } from "../../db/schema.js";
import { and, desc, eq, lt, sql, isNull } from "drizzle-orm";
import type { CreateCommentDto } from "./comment.dto.js";
import { AppError } from "../../utils/AppError.js";

export class CommentRepository {
    // Transaction: Insert Comment + Increment Post Count
    async create(userId: string, data: CreateCommentDto) {
        return await db.transaction(async (tx: any) => {
            // 1. Check if post exists (optional if foreign key ensures it, but good for custom error)
            // Or just let insert fail. Let's check to be safe/clean.
            // Skipping distinct check for performance, relying on FK Constraint mostly.

            // 2. Insert Comment
            const [newComment] = await tx
                .insert(comments)
                .values({
                    userId,
                    postId: data.postId,
                    content: data.content,
                    parentId: data.parentId || null,
                })
                .returning();

            if (!newComment) throw new AppError("Failed to create comment", 500);

            // 3. Atomically Increment Post Comment Count
            await tx
                .update(posts)
                .set({
                    commentsCount: sql`${posts.commentsCount} + 1`,
                })
                .where(eq(posts.id, data.postId));

            // 4. Fetch full comment with user info for response
            const [commentWithUser] = await tx
                .select({
                    id: comments.id,
                    content: comments.content,
                    likesCount: comments.likesCount,
                    createdAt: comments.createdAt,
                    updatedAt: comments.updatedAt,
                    parentId: comments.parentId,
                    user: {
                        id: users.id,
                        username: users.username,
                        name: users.name,
                        avatarUrl: users.avatarUrl,
                    },
                    repliesCount: sql<number>`0`,
                })
                .from(comments)
                .innerJoin(users, eq(comments.userId, users.id))
                .where(eq(comments.id, newComment.id));

            return commentWithUser;
        });
    }

    // Cursor-Based Pagination
    async findByPostId(postId: string, limit: number, cursor?: string, parentId?: string) {
        // Condition construction
        const conditions = [eq(comments.postId, postId)];

        // If fetching replies (threaded view)
        if (parentId) {
            conditions.push(eq(comments.parentId, parentId));
        } else {
            // Fetch top-level comments
            conditions.push(isNull(comments.parentId));
        }

        // Cursor condition: fetch older comments (created < cursor)
        if (cursor) {
            conditions.push(lt(comments.createdAt, new Date(cursor)));
        }

        // Subquery for replies count
        const repliesCountSq = db
            .select({
                parentId: comments.parentId,
                count: sql<number>`count(*)`.as("count"),
            })
            .from(comments)
            .where(eq(comments.postId, postId))
            .groupBy(comments.parentId)
            .as("replies_count_sq");

        // Execute Query
        // Join with Users to get author info
        const result = await db
            .select({
                id: comments.id,
                content: comments.content,
                likesCount: comments.likesCount,
                createdAt: comments.createdAt,
                updatedAt: comments.updatedAt,
                parentId: comments.parentId,
                user: {
                    id: users.id,
                    username: users.username,
                    name: users.name,
                    avatarUrl: users.avatarUrl,
                },
                repliesCount: sql<number>`COALESCE(${repliesCountSq.count}, 0)`,
            })
            .from(comments)
            .innerJoin(users, eq(comments.userId, users.id))
            .leftJoin(repliesCountSq, eq(comments.id, repliesCountSq.parentId))
            .where(and(...conditions))
            .orderBy(desc(comments.createdAt)) // Composite Index (postId, createdAt DESC) used here
            .limit(limit + 1); // Fetch one extra to determine next cursor

        return result;
    }
}
