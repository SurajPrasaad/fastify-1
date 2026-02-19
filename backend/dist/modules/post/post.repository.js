import { db } from "../../config/drizzle.js";
import { posts, users, postVersions, hashtags, postHashtags } from "../../db/schema.js";
import { and, desc, eq, lt, sql, count } from "drizzle-orm";
export class PostRepository {
    async create(data) {
        const status = data.status || 'PUBLISHED';
        const [post] = await db
            .insert(posts)
            .values({
            userId: data.userId,
            content: data.content,
            codeSnippet: data.codeSnippet || null,
            language: data.language || null,
            mediaUrls: data.mediaUrls || [],
            status: status,
            publishedAt: status === 'PUBLISHED' ? new Date() : null,
        })
            .returning();
        return post;
    }
    async findById(id, includePrivate = false) {
        const query = db
            .select()
            .from(posts)
            .where(eq(posts.id, id));
        const [post] = await query;
        if (!post)
            return null;
        // Soft delete check
        if (post.status === 'DELETED')
            return null;
        // Draft check
        if (post.status === 'DRAFT' && !includePrivate)
            return null;
        return post;
    }
    async findMany(limit, cursor) {
        const query = db
            .select({
            id: posts.id,
            userId: posts.userId,
            content: posts.content,
            codeSnippet: posts.codeSnippet,
            language: posts.language,
            mediaUrls: posts.mediaUrls,
            status: posts.status,
            commentsCount: posts.commentsCount,
            likesCount: posts.likesCount,
            publishedAt: posts.publishedAt,
            createdAt: posts.createdAt,
            updatedAt: posts.updatedAt,
            author: {
                username: users.username,
                name: users.name,
            },
        })
            .from(posts)
            .innerJoin(users, eq(posts.userId, users.id))
            .where(and(eq(posts.status, 'PUBLISHED'), cursor ? lt(posts.publishedAt, new Date(cursor)) : undefined))
            .orderBy(desc(posts.publishedAt))
            .limit(limit + 1);
        return await query;
    }
    async update(id, userId, data) {
        return await db.transaction(async (tx) => {
            // 1. Get current post for versioning
            const [current] = await tx
                .select()
                .from(posts)
                .where(and(eq(posts.id, id), eq(posts.userId, userId)))
                .limit(1);
            if (!current)
                return null;
            // 2. Save version
            const [vCount] = await tx
                .select({ count: count() })
                .from(postVersions)
                .where(eq(postVersions.postId, id));
            await tx.insert(postVersions).values({
                postId: id,
                content: current.content,
                codeSnippet: current.codeSnippet,
                language: current.language,
                mediaUrls: current.mediaUrls,
                version: (Number(vCount?.count) || 0) + 1,
            });
            // 3. Update post
            const [updated] = await tx
                .update(posts)
                .set({
                ...data,
                updatedAt: new Date(),
            })
                .where(and(eq(posts.id, id), eq(posts.userId, userId)))
                .returning();
            return updated;
        });
    }
    async publish(id, userId) {
        const [published] = await db
            .update(posts)
            .set({
            status: 'PUBLISHED',
            publishedAt: new Date(),
            updatedAt: new Date(),
        })
            .where(and(eq(posts.id, id), eq(posts.userId, userId), eq(posts.status, 'DRAFT')))
            .returning();
        return published;
    }
    async archive(id, userId) {
        const [archived] = await db
            .update(posts)
            .set({
            status: 'ARCHIVED',
            updatedAt: new Date(),
        })
            .where(and(eq(posts.id, id), eq(posts.userId, userId)))
            .returning();
        return archived;
    }
    async delete(id, userId) {
        const [deleted] = await db
            .update(posts)
            .set({
            status: 'DELETED',
            updatedAt: new Date(),
        })
            .where(and(eq(posts.id, id), eq(posts.userId, userId)))
            .returning();
        return deleted;
    }
    async linkHashtags(postId, hashtagNames) {
        if (hashtagNames.length === 0)
            return;
        await db.transaction(async (tx) => {
            for (const name of hashtagNames) {
                // Upsert hashtag
                const [hashtag] = await tx
                    .insert(hashtags)
                    .values({ name, postsCount: 1 })
                    .onConflictDoUpdate({
                    target: hashtags.name,
                    set: {
                        postsCount: sql `${hashtags.postsCount} + 1`,
                        lastUsedAt: new Date()
                    }
                })
                    .returning();
                // Link to post
                if (hashtag) {
                    await tx.insert(postHashtags).values({
                        postId,
                        hashtagId: hashtag.id
                    }).onConflictDoNothing();
                }
            }
        });
    }
}
//# sourceMappingURL=post.repository.js.map