
import { db } from "../../config/drizzle.js";
import { posts, users } from "../../db/schema.js";
import { and, desc, eq, inArray, lt, notInArray, sql } from "drizzle-orm";

export class RecommendationRepository {
    /**
     * Fetch tags for a specific post.
     */
    async getPostTags(postId: string): Promise<string[]> {
        const result = await db
            .select({ tags: posts.tags })
            .from(posts)
            .where(eq(posts.id, postId))
            .limit(1);

        return result[0]?.tags || [];
    }

    /**
     * Find posts matching any of variable tags.
     * Logic: WHERE tags ?| ARRAY['tag1', 'tag2']
     */
    async findByTags(tags: string[], limit: number, excludeIds: string[] = []) {
        if (tags.length === 0) return [];

        // Construct raw SQL for JSONB intersection: tags ?| ARRAY[...]
        // We cast the input array to text[] to ensure proper Postgres type matching for ?| operator
        const tagsArraySql = sql`ARRAY[${sql.join(tags.map(t => sql`${t}`), sql`, `)}]`;

        return await db
            .select({
                id: posts.id,
                userId: posts.userId,
                content: posts.content,
                mediaUrls: posts.mediaUrls,
                tags: posts.tags,
                status: posts.status,
                commentsCount: posts.commentsCount,
                likesCount: posts.likesCount,
                createdAt: posts.createdAt,
                author: {
                    username: users.username,
                    name: users.name,
                },
                // Sort by popularity score simpler version: likes + comments
                metricsScore: sql<number>`(${posts.likesCount} + ${posts.commentsCount})`.as('metrics_score'),
            })
            .from(posts)
            .innerJoin(users, eq(posts.userId, users.id))
            .where(
                and(
                    eq(posts.status, 'PUBLISHED'),
                    sql`${posts.tags} ?| ${tagsArraySql}`, // Does post tags contain ANY of the interest tags?
                    excludeIds.length > 0 ? notInArray(posts.id, excludeIds) : undefined
                )
            )
            .orderBy(desc(sql`metrics_score`), desc(posts.createdAt))
            .limit(limit);
    }

    /**
     * Fallback for Cold Start: Global Trending (Top posts in last 24h or generally popular)
     */
    async getGlobalTrending(limit: number, excludeIds: string[] = []) {
        // Basic scoring: likes + comments * 2
        return await db
            .select({
                id: posts.id,
                userId: posts.userId,
                content: posts.content,
                mediaUrls: posts.mediaUrls,
                tags: posts.tags,
                status: posts.status,
                commentsCount: posts.commentsCount,
                likesCount: posts.likesCount,
                createdAt: posts.createdAt,
                author: {
                    username: users.username,
                    name: users.name,
                },
                metricsScore: sql<number>`(${posts.likesCount} + ${posts.commentsCount} * 2)`.as('metrics_score'),
            })
            .from(posts)
            .innerJoin(users, eq(posts.userId, users.id))
            .where(
                and(
                    eq(posts.status, 'PUBLISHED'),
                    excludeIds.length > 0 ? notInArray(posts.id, excludeIds) : undefined
                )
            )
            .orderBy(desc(sql`metrics_score`), desc(posts.createdAt))
            .limit(limit);
    }
}
