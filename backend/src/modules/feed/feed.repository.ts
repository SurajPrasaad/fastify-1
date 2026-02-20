
import { db } from "../../config/drizzle.js";
import { posts, users, follows, celebrityAccounts, rankingFeatures } from "../../db/schema.js";
import { and, desc, eq, inArray, lt, sql, exists } from "drizzle-orm";

export class FeedRepository {
    // 1. Bulk Fetch for Hydration pattern
    async findByIds(ids: string[]) {
        if (ids.length === 0) return [];

        const result = await db
            .select({
                id: posts.id,
                userId: posts.userId,
                content: posts.content,
                mediaUrl: sql<string>`${posts.mediaUrls}->>0`, // Frontend expects single string for now or adapt frontend
                type: sql<string>`CASE 
                    WHEN jsonb_array_length(${posts.mediaUrls}) > 0 THEN 'IMAGE' 
                    ELSE 'TEXT' 
                END`.as('type'), // Basic inference
                createdAt: posts.createdAt,
                updatedAt: posts.updatedAt,
                user: {
                    id: users.id,
                    username: users.username,
                    name: users.name,
                    avatarUrl: users.avatarUrl,
                },
                stats: {
                    likeCount: posts.likesCount,
                    commentCount: posts.commentsCount,
                    repostCount: sql<number>`0`.as('repostCount'), // Placeholder until reposts count is added to posts table or separate query
                }
            })
            .from(posts)
            .innerJoin(users, eq(posts.userId, users.id))
            .where(inArray(posts.id, ids));

        return result.map(post => ({
            ...post,
            type: post.type as 'TEXT' | 'IMAGE' | 'VIDEO',
            stats: {
                ...post.stats,
                repostCount: Number(post.stats.repostCount)
            }
        }));
    }

    // 2. Hybrid model: Fetch posts from followed celebrities (Pull model)
    async getCelebrityPosts(userId: string, limit: number, cursor?: string) {
        // Find users I follow who are celebrities
        const celebritySubquery = db
            .select({ followingId: follows.followingId })
            .from(follows)
            .innerJoin(celebrityAccounts, eq(follows.followingId, celebrityAccounts.userId))
            .where(eq(follows.followerId, userId));

        const result = await db
            .select({
                id: posts.id,
                userId: posts.userId,
                content: posts.content,
                mediaUrl: sql<string>`${posts.mediaUrls}->>0`,
                type: sql<string>`CASE 
                    WHEN jsonb_array_length(${posts.mediaUrls}) > 0 THEN 'IMAGE' 
                    ELSE 'TEXT' 
                END`.as('type'),
                createdAt: posts.createdAt,
                updatedAt: posts.updatedAt,
                publishedAt: posts.publishedAt,
                user: {
                    id: users.id,
                    username: users.username,
                    name: users.name,
                    avatarUrl: users.avatarUrl,
                },
                stats: {
                    likeCount: posts.likesCount,
                    commentCount: posts.commentsCount,
                    repostCount: sql<number>`0`.as('repostCount'),
                }
            })
            .from(posts)
            .innerJoin(users, eq(posts.userId, users.id))
            .where(
                and(
                    eq(posts.status, 'PUBLISHED'),
                    inArray(posts.userId, celebritySubquery),
                    cursor ? lt(posts.publishedAt, new Date(cursor)) : undefined
                )
            )
            .orderBy(desc(posts.publishedAt))
            .limit(limit);

        return result.map(post => ({
            ...post,
            type: post.type as 'TEXT' | 'IMAGE' | 'VIDEO',
            stats: { ...post.stats, repostCount: Number(post.stats.repostCount) }
        }));
    }

    // 3. Follower fetching for Fan-out on Write
    async getFollowerIds(userId: string, limit: number = 1000, offset: number = 0) {
        return await db
            .select({ followerId: follows.followerId })
            .from(follows)
            .where(eq(follows.followingId, userId))
            .limit(limit)
            .offset(offset);
    }

    // 4. Celebrity check
    async isCelebrity(userId: string): Promise<boolean> {
        const [celebrity] = await db
            .select()
            .from(celebrityAccounts)
            .where(eq(celebrityAccounts.userId, userId))
            .limit(1);
        return !!celebrity;
    }

    // 5. User Affinity Scores for ranking
    async getAffinityScores(userId: string) {
        return await db
            .select({
                targetUserId: rankingFeatures.targetUserId,
                score: rankingFeatures.affinityScore,
            })
            .from(rankingFeatures)
            .where(eq(rankingFeatures.userId, userId));
    }

    // 6. Fallback SQL Feed (Cold Start)
    async getHomeFeedFallback(userId: string, limit: number, cursor?: string) {
        const followingSubquery = db
            .select({ followingId: follows.followingId })
            .from(follows)
            .where(eq(follows.followerId, userId));

        const result = await db
            .select({
                id: posts.id,
                userId: posts.userId,
                content: posts.content,
                mediaUrl: sql<string>`${posts.mediaUrls}->>0`,
                type: sql<string>`CASE 
                    WHEN jsonb_array_length(${posts.mediaUrls}) > 0 THEN 'IMAGE' 
                    ELSE 'TEXT' 
                END`.as('type'),
                createdAt: posts.createdAt,
                updatedAt: posts.updatedAt,
                publishedAt: posts.publishedAt,
                user: {
                    id: users.id,
                    username: users.username,
                    name: users.name,
                    avatarUrl: users.avatarUrl,
                },
                stats: {
                    likeCount: posts.likesCount,
                    commentCount: posts.commentsCount,
                    repostCount: sql<number>`0`.as('repostCount'),
                }
            })
            .from(posts)
            .innerJoin(users, eq(posts.userId, users.id))
            .where(
                and(
                    eq(posts.status, 'PUBLISHED'),
                    inArray(posts.userId, followingSubquery),
                    cursor ? lt(posts.publishedAt, new Date(cursor)) : undefined
                )
            )
            .orderBy(desc(posts.publishedAt))
            .limit(limit);

        return result.map(post => ({
            ...post,
            type: post.type as 'TEXT' | 'IMAGE' | 'VIDEO',
            stats: { ...post.stats, repostCount: Number(post.stats.repostCount) }
        }));
    }

    // 7. Global Explore Feed
    async getExploreFeed(limit: number, cursor?: string) {
        const result = await db
            .select({
                id: posts.id,
                userId: posts.userId,
                content: posts.content,
                mediaUrl: sql<string>`${posts.mediaUrls}->>0`,
                type: sql<string>`CASE 
                    WHEN jsonb_array_length(${posts.mediaUrls}) > 0 THEN 'IMAGE' 
                    ELSE 'TEXT' 
                END`.as('type'),
                createdAt: posts.createdAt,
                updatedAt: posts.updatedAt,
                publishedAt: posts.publishedAt,
                user: {
                    id: users.id,
                    username: users.username,
                    name: users.name,
                    avatarUrl: users.avatarUrl,
                },
                stats: {
                    likeCount: posts.likesCount,
                    commentCount: posts.commentsCount,
                    repostCount: sql<number>`0`.as('repostCount'),
                }
            })
            .from(posts)
            .innerJoin(users, eq(posts.userId, users.id))
            .where(
                and(
                    eq(posts.status, 'PUBLISHED'),
                    cursor ? lt(posts.publishedAt, new Date(cursor)) : undefined
                )
            )
            .orderBy(desc(posts.publishedAt))
            .limit(limit);

        return result.map(post => ({
            ...post,
            type: post.type as 'TEXT' | 'IMAGE' | 'VIDEO',
            stats: { ...post.stats, repostCount: Number(post.stats.repostCount) }
        }));
    }

    // 8. Hashtag Feed
    async getHashtagFeed(tag: string, limit: number, cursor?: string) {
        const result = await db
            .select({
                id: posts.id,
                userId: posts.userId,
                content: posts.content,
                mediaUrl: sql<string>`${posts.mediaUrls}->>0`,
                type: sql<string>`CASE 
                    WHEN jsonb_array_length(${posts.mediaUrls}) > 0 THEN 'IMAGE' 
                    ELSE 'TEXT' 
                END`.as('type'),
                createdAt: posts.createdAt,
                updatedAt: posts.updatedAt,
                publishedAt: posts.publishedAt,
                user: {
                    id: users.id,
                    username: users.username,
                    name: users.name,
                    avatarUrl: users.avatarUrl,
                },
                stats: {
                    likeCount: posts.likesCount,
                    commentCount: posts.commentsCount,
                    repostCount: sql<number>`0`.as('repostCount'),
                }
            })
            .from(posts)
            .innerJoin(users, eq(posts.userId, users.id))
            .where(
                and(
                    eq(posts.status, 'PUBLISHED'),
                    sql`${posts.tags} ? ${tag}`,
                    cursor ? lt(posts.publishedAt, new Date(cursor)) : undefined
                )
            )
            .orderBy(desc(posts.publishedAt))
            .limit(limit);

        return result.map(post => ({
            ...post,
            type: post.type as 'TEXT' | 'IMAGE' | 'VIDEO',
            stats: { ...post.stats, repostCount: Number(post.stats.repostCount) }
        }));
    }
}
