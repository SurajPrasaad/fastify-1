
import { db } from "../../config/drizzle.js";
import { posts, users, hashtags, postHashtags, follows, userCounters, likes, bookmarks } from "../../db/schema.js";
import { and, desc, eq, inArray, lt, sql, notInArray, ilike, or, gt } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { redis } from "../../config/redis.js";
import type { CandidateSource } from "./explore.dto.js";

export class ExploreRepository {

    // ─── REDIS KEY HELPERS ──────────────────────────────────────────────────

    private keys = {
        trendingGlobal: "explore:trending:global",
        trendingRegion: (region: string) => `explore:trending:region:${region}`,
        trendingCategory: (slug: string) => `explore:trending:cat:${slug}`,
        trendingTag: (tag: string) => `explore:trending:tag:${tag}`,
        postScore: (postId: string) => `explore:score:${postId}`,
        userAffinity: (userId: string) => `user:affinity:${userId}`,
        userAuthorAffinity: (userId: string) => `user:author_affinity:${userId}`,
        userSeen: (userId: string) => `user:seen:${userId}`,
        postHydrated: (postId: string) => `explore:post:hydrated:${postId}`,
        trendingHashtags: "explore:trending:hashtags",
        rateLimit: (userId: string, window: string) => `ratelimit:explore:${userId}:${window}`,
    };

    // ─── TRENDING CANDIDATES (REDIS) ────────────────────────────────────────

    /**
     * Fetch top trending post IDs from Redis sorted set.
     * Returns postIds scored by trending algorithm. 
     */
    async getTrendingPostIds(limit: number, offset: number = 0, region?: string): Promise<string[]> {
        const key = region ? this.keys.trendingRegion(region) : this.keys.trendingGlobal;
        try {
            return await redis.zrevrange(key, offset, offset + limit - 1);
        } catch {
            return [];
        }
    }

    /**
     * Fetch trending post IDs for a specific category.
     */
    async getCategoryTrendingIds(slug: string, limit: number, offset: number = 0): Promise<string[]> {
        const key = this.keys.trendingCategory(slug);
        try {
            return await redis.zrevrange(key, offset, offset + limit - 1);
        } catch {
            return [];
        }
    }

    // ─── PERSONALIZED CANDIDATES ────────────────────────────────────────────

    /**
     * Get the user's top interest tags from Redis affinity ZSET.
     */
    async getUserTopInterests(userId: string, count: number = 10): Promise<string[]> {
        try {
            return await redis.zrevrange(this.keys.userAffinity(userId), 0, count - 1);
        } catch {
            return [];
        }
    }

    /**
     * Get the user's top-affinity authors from Redis.
     */
    async getUserTopAuthors(userId: string, count: number = 5): Promise<string[]> {
        try {
            return await redis.zrevrange(this.keys.userAuthorAffinity(userId), 0, count - 1);
        } catch {
            return [];
        }
    }

    /**
     * Get the set of post IDs the user has already seen.
     */
    async getSeenPostIds(userId: string): Promise<Set<string>> {
        try {
            const seen = await redis.smembers(this.keys.userSeen(userId));
            return new Set(seen);
        } catch {
            return new Set();
        }
    }

    /**
     * Mark post IDs as seen for deduplication.
     */
    async markAsSeen(userId: string, postIds: string[]): Promise<void> {
        if (postIds.length === 0) return;
        try {
            const pipeline = redis.pipeline();
            pipeline.sadd(this.keys.userSeen(userId), ...postIds);
            pipeline.expire(this.keys.userSeen(userId), 7 * 24 * 3600); // 7 day TTL
            await pipeline.exec();
        } catch {
            // Non-critical, silently fail
        }
    }

    // ─── SCORE MANAGEMENT (REDIS) ───────────────────────────────────────────

    /**
     * Update the trending score for a post in all relevant sorted sets.
     */
    async updateTrendingScore(postId: string, score: number, tags: string[], region?: string): Promise<void> {
        try {
            const pipeline = redis.pipeline();

            // Global trending
            pipeline.zadd(this.keys.trendingGlobal, score.toString(), postId);
            // Keep top 10K posts
            pipeline.zremrangebyrank(this.keys.trendingGlobal, 0, -10001);

            // Regional trending
            if (region) {
                pipeline.zadd(this.keys.trendingRegion(region), score.toString(), postId);
                pipeline.zremrangebyrank(this.keys.trendingRegion(region), 0, -5001);
            }

            // Category/tag trending
            for (const tag of tags.slice(0, 5)) { // max 5 tags
                pipeline.zadd(this.keys.trendingCategory(tag), score.toString(), postId);
                pipeline.zremrangebyrank(this.keys.trendingCategory(tag), 0, -2001);
            }

            // Set 48h expiry on global key (auto-cleanup)
            pipeline.expire(this.keys.trendingGlobal, 48 * 3600);

            await pipeline.exec();
        } catch (err) {
            console.error("[ExploreRepo] Failed to update trending score:", err);
        }
    }

    /**
     * Remove a post from all trending sets (e.g., on deletion or moderation).
     */
    async removeTrendingPost(postId: string): Promise<void> {
        try {
            // Remove from global — other sets will expire naturally
            await redis.zrem(this.keys.trendingGlobal, postId);
        } catch {
            // Non-critical
        }
    }

    // ─── INTERACTION TRACKING (REDIS) ───────────────────────────────────────

    /**
     * Update user's interest affinity based on interaction.
     */
    async updateUserAffinity(userId: string, tags: string[], authorId: string, scoreDelta: number): Promise<void> {
        try {
            const pipeline = redis.pipeline();
            const affinityKey = this.keys.userAffinity(userId);
            const authorKey = this.keys.userAuthorAffinity(userId);

            for (const tag of tags) {
                pipeline.zincrby(affinityKey, scoreDelta, tag);
            }

            if (authorId && scoreDelta > 0) {
                pipeline.zincrby(authorKey, scoreDelta * 0.5, authorId);
            }

            // TTL: 30 days
            pipeline.expire(affinityKey, 30 * 24 * 3600);
            pipeline.expire(authorKey, 30 * 24 * 3600);

            await pipeline.exec();
        } catch {
            // Non-critical
        }
    }

    // ─── POST HYDRATION (PostgreSQL) ─────────────────────────────────────────

    /**
     * Hydrate post IDs into full post objects with author info.
     * This is the primary hydration query used after candidate selection + ranking.
     */
    async hydratePostIds(postIds: string[], currentUserId?: string) {
        if (postIds.length === 0) return [];

        const results = await db
            .select({
                id: posts.id,
                userId: posts.userId,
                content: posts.content,
                mediaUrls: posts.mediaUrls,
                tags: posts.tags,
                originalPostId: posts.originalPostId,
                createdAt: posts.createdAt,
                updatedAt: posts.updatedAt,
                publishedAt: posts.publishedAt,
                likesCount: posts.likesCount,
                commentsCount: posts.commentsCount,
                repostsCount: posts.repostsCount,
                author: {
                    id: users.id,
                    username: users.username,
                    name: users.name,
                    avatarUrl: users.avatarUrl,
                },
                isLiked: currentUserId
                    ? sql<boolean>`EXISTS (SELECT 1 FROM likes WHERE target_id = ${posts.id} AND user_id = ${currentUserId} AND target_type = 'POST')`
                    : sql<boolean>`false`,
                isBookmarked: currentUserId
                    ? sql<boolean>`EXISTS (SELECT 1 FROM bookmarks WHERE post_id = ${posts.id} AND user_id = ${currentUserId})`
                    : sql<boolean>`false`,
            })
            .from(posts)
            .innerJoin(users, eq(posts.userId, users.id))
            .where(
                and(
                    inArray(posts.id, postIds),
                    eq(posts.status, "PUBLISHED")
                )
            );

        // Preserve ordering from postIds
        const postMap = new Map(results.map(p => [p.id, p]));
        return postIds.map(id => postMap.get(id)).filter(Boolean);
    }

    // ─── FALLBACK QUERIES (PostgreSQL) ──────────────────────────────────────

    /**
     * PostgreSQL fallback for trending (when Redis is unavailable).
     * Uses engagement velocity: (likes + comments*2 + reposts*3) / age
     */
    async getFallbackTrending(limit: number, cursor?: string, excludeIds: string[] = []) {
        return await db
            .select({
                id: posts.id,
                userId: posts.userId,
                content: posts.content,
                mediaUrls: posts.mediaUrls,
                tags: posts.tags,
                originalPostId: posts.originalPostId,
                createdAt: posts.createdAt,
                updatedAt: posts.updatedAt,
                publishedAt: posts.publishedAt,
                likesCount: posts.likesCount,
                commentsCount: posts.commentsCount,
                repostsCount: posts.repostsCount,
                author: {
                    id: users.id,
                    username: users.username,
                    name: users.name,
                    avatarUrl: users.avatarUrl,
                },
                trendingScore: sql<number>`(
                    (${posts.likesCount} + ${posts.commentsCount} * 2 + ${posts.repostsCount} * 3)::float
                    / (EXTRACT(EPOCH FROM (NOW() - ${posts.createdAt})) / 3600 + 2)
                )`.as("trending_score"),
            })
            .from(posts)
            .innerJoin(users, eq(posts.userId, users.id))
            .where(
                and(
                    eq(posts.status, "PUBLISHED"),
                    gt(posts.createdAt, sql`NOW() - INTERVAL '48 hours'`),
                    excludeIds.length > 0 ? notInArray(posts.id, excludeIds) : undefined,
                    cursor ? lt(posts.createdAt, new Date(cursor)) : undefined
                )
            )
            .orderBy(desc(sql`trending_score`))
            .limit(limit);
    }

    /**
     * Fetch posts by tags for personalized candidates (PostgreSQL fallback).
     */
    async getPostsByTags(tags: string[], limit: number, excludeIds: string[] = []) {
        if (tags.length === 0) return [];

        const tagsArraySql = sql`ARRAY[${sql.join(tags.map(t => sql`${t}`), sql`, `)}]`;

        return await db
            .select({
                id: posts.id,
                userId: posts.userId,
                content: posts.content,
                mediaUrls: posts.mediaUrls,
                tags: posts.tags,
                originalPostId: posts.originalPostId,
                createdAt: posts.createdAt,
                updatedAt: posts.updatedAt,
                publishedAt: posts.publishedAt,
                likesCount: posts.likesCount,
                commentsCount: posts.commentsCount,
                repostsCount: posts.repostsCount,
                author: {
                    id: users.id,
                    username: users.username,
                    name: users.name,
                    avatarUrl: users.avatarUrl,
                },
                relevanceScore: sql<number>`(${posts.likesCount} + ${posts.commentsCount} * 2)`.as("relevance_score"),
            })
            .from(posts)
            .innerJoin(users, eq(posts.userId, users.id))
            .where(
                and(
                    eq(posts.status, "PUBLISHED"),
                    sql`${posts.tags} ?| ${tagsArraySql}`,
                    excludeIds.length > 0 ? notInArray(posts.id, excludeIds) : undefined
                )
            )
            .orderBy(desc(sql`relevance_score`), desc(posts.createdAt))
            .limit(limit);
    }

    /**
     * Fetch posts by specific author IDs.
     */
    async getPostsByAuthors(authorIds: string[], limit: number, excludeIds: string[] = []) {
        if (authorIds.length === 0) return [];

        return await db
            .select({
                id: posts.id,
                userId: posts.userId,
                content: posts.content,
                mediaUrls: posts.mediaUrls,
                tags: posts.tags,
                originalPostId: posts.originalPostId,
                createdAt: posts.createdAt,
                updatedAt: posts.updatedAt,
                publishedAt: posts.publishedAt,
                likesCount: posts.likesCount,
                commentsCount: posts.commentsCount,
                repostsCount: posts.repostsCount,
                author: {
                    id: users.id,
                    username: users.username,
                    name: users.name,
                    avatarUrl: users.avatarUrl,
                },
            })
            .from(posts)
            .innerJoin(users, eq(posts.userId, users.id))
            .where(
                and(
                    eq(posts.status, "PUBLISHED"),
                    inArray(posts.userId, authorIds),
                    excludeIds.length > 0 ? notInArray(posts.id, excludeIds) : undefined
                )
            )
            .orderBy(desc(posts.createdAt))
            .limit(limit);
    }

    // ─── CATEGORY DISCOVERY ─────────────────────────────────────────────────

    /**
     * Fetch posts matching a category/tag slug.
     */
    async getCategoryPosts(slug: string, limit: number, cursor?: string) {
        return await db
            .select({
                id: posts.id,
                userId: posts.userId,
                content: posts.content,
                mediaUrls: posts.mediaUrls,
                tags: posts.tags,
                originalPostId: posts.originalPostId,
                createdAt: posts.createdAt,
                updatedAt: posts.updatedAt,
                publishedAt: posts.publishedAt,
                likesCount: posts.likesCount,
                commentsCount: posts.commentsCount,
                repostsCount: posts.repostsCount,
                author: {
                    id: users.id,
                    username: users.username,
                    name: users.name,
                    avatarUrl: users.avatarUrl,
                },
            })
            .from(posts)
            .innerJoin(users, eq(posts.userId, users.id))
            .where(
                and(
                    eq(posts.status, "PUBLISHED"),
                    sql`${posts.tags} ? ${slug}`,
                    cursor ? lt(posts.publishedAt, new Date(cursor)) : undefined
                )
            )
            .orderBy(desc(posts.publishedAt))
            .limit(limit);
    }

    // ─── SEARCH ─────────────────────────────────────────────────────────────

    /**
     * Full-text search across posts using PostgreSQL (OpenSearch fallback).
     * Uses pg tsvector for basic search capability.
     */
    async searchPosts(query: string, limit: number, cursor?: string) {
        return await db
            .select({
                id: posts.id,
                userId: posts.userId,
                content: posts.content,
                mediaUrls: posts.mediaUrls,
                tags: posts.tags,
                originalPostId: posts.originalPostId,
                createdAt: posts.createdAt,
                updatedAt: posts.updatedAt,
                publishedAt: posts.publishedAt,
                likesCount: posts.likesCount,
                commentsCount: posts.commentsCount,
                repostsCount: posts.repostsCount,
                author: {
                    id: users.id,
                    username: users.username,
                    name: users.name,
                    avatarUrl: users.avatarUrl,
                },
                searchRank: sql<number>`ts_rank(
                    to_tsvector('english', ${posts.content}),
                    plainto_tsquery('english', ${query})
                )`.as("search_rank"),
            })
            .from(posts)
            .innerJoin(users, eq(posts.userId, users.id))
            .where(
                and(
                    eq(posts.status, "PUBLISHED"),
                    sql`to_tsvector('english', ${posts.content}) @@ plainto_tsquery('english', ${query})`,
                    cursor ? lt(posts.createdAt, new Date(cursor)) : undefined
                )
            )
            .orderBy(desc(sql`search_rank`), desc(posts.createdAt))
            .limit(limit);
    }

    /**
     * Search users by username or name.
     */
    async searchUsers(query: string, limit: number) {
        return await db
            .select({
                id: users.id,
                username: users.username,
                name: users.name,
                avatarUrl: users.avatarUrl,
                bio: users.bio,
            })
            .from(users)
            .where(
                and(
                    eq(users.status, "ACTIVE"),
                    or(
                        ilike(users.username, `%${query}%`),
                        ilike(users.name, `%${query}%`)
                    )
                )
            )
            .orderBy(users.username)
            .limit(limit);
    }

    /**
     * Search hashtags by name.
     */
    async searchHashtags(query: string, limit: number) {
        return await db
            .select({
                id: hashtags.id,
                name: hashtags.name,
                postsCount: hashtags.postsCount,
                lastUsedAt: hashtags.lastUsedAt,
            })
            .from(hashtags)
            .where(ilike(hashtags.name, `%${query}%`))
            .orderBy(desc(hashtags.postsCount))
            .limit(limit);
    }

    // ─── TRENDING HASHTAGS ──────────────────────────────────────────────────

    /**
     * Fetch trending hashtags by post count velocity.
     */
    async getTrendingHashtags(limit: number) {
        return await db
            .select({
                id: hashtags.id,
                name: hashtags.name,
                postsCount: hashtags.postsCount,
                lastUsedAt: hashtags.lastUsedAt,
            })
            .from(hashtags)
            .where(gt(hashtags.postsCount, 0))
            .orderBy(desc(hashtags.postsCount))
            .limit(limit);
    }

    // ─── CREATOR RECOMMENDATIONS ────────────────────────────────────────────

    /**
     * Find recommended creators based on overlapping interests or popularity.
     * For authenticated users, excludes already-followed users.
     */
    async getRecommendedCreators(limit: number, currentUserId?: string, interestTags?: string[]) {
        // Base query: popular content creators the user doesn't follow
        const baseConditions = [eq(users.status, "ACTIVE")];

        if (currentUserId) {
            // Exclude self and already-followed users
            const followingSubquery = db
                .select({ followingId: follows.followingId })
                .from(follows)
                .where(eq(follows.followerId, currentUserId));

            baseConditions.push(
                sql`${users.id} != ${currentUserId}`,
                sql`${users.id} NOT IN (${followingSubquery})`
            );
        }

        return await db
            .select({
                id: users.id,
                username: users.username,
                name: users.name,
                avatarUrl: users.avatarUrl,
                bio: users.bio,
                followersCount: userCounters.followersCount,
                postsCount: userCounters.postsCount,
            })
            .from(users)
            .leftJoin(userCounters, eq(users.id, userCounters.userId))
            .where(and(...baseConditions))
            .orderBy(desc(userCounters.followersCount))
            .limit(limit);
    }

    // ─── POST TAG LOOKUP ────────────────────────────────────────────────────

    /**
     * Get tags for a specific post.
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
     * Get post author ID.
     */
    async getPostAuthorId(postId: string): Promise<string | null> {
        const result = await db
            .select({ userId: posts.userId })
            .from(posts)
            .where(eq(posts.id, postId))
            .limit(1);
        return result[0]?.userId || null;
    }

    // ─── ENGAGEMENT COUNTERS (for score computation) ────────────────────────

    /**
     * Get engagement data for a post (used by score workers).
     */
    async getPostEngagement(postId: string) {
        const result = await db
            .select({
                id: posts.id,
                likesCount: posts.likesCount,
                commentsCount: posts.commentsCount,
                repostsCount: posts.repostsCount,
                createdAt: posts.createdAt,
                tags: posts.tags,
                userId: posts.userId,
            })
            .from(posts)
            .where(eq(posts.id, postId))
            .limit(1);
        return result[0] || null;
    }

    // ─── SERENDIPITY / RANDOM DISCOVERY ─────────────────────────────────────

    /**
     * Fetch random recent published posts for serendipity/diversity injection.
     */
    async getRandomRecentPosts(limit: number, excludeIds: string[] = []) {
        return await db
            .select({
                id: posts.id,
                userId: posts.userId,
                content: posts.content,
                mediaUrls: posts.mediaUrls,
                tags: posts.tags,
                originalPostId: posts.originalPostId,
                createdAt: posts.createdAt,
                updatedAt: posts.updatedAt,
                publishedAt: posts.publishedAt,
                likesCount: posts.likesCount,
                commentsCount: posts.commentsCount,
                repostsCount: posts.repostsCount,
                author: {
                    id: users.id,
                    username: users.username,
                    name: users.name,
                    avatarUrl: users.avatarUrl,
                },
            })
            .from(posts)
            .innerJoin(users, eq(posts.userId, users.id))
            .where(
                and(
                    eq(posts.status, "PUBLISHED"),
                    gt(posts.createdAt, sql`NOW() - INTERVAL '7 days'`),
                    excludeIds.length > 0 ? notInArray(posts.id, excludeIds) : undefined
                )
            )
            .orderBy(sql`RANDOM()`)
            .limit(limit);
    }
}
