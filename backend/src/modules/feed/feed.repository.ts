
import { db } from "../../config/drizzle.js";
import { posts, users, follows, celebrityAccounts, rankingFeatures, polls, pollOptions } from "../../db/schema.js";
import { and, desc, eq, inArray, lt, sql, exists } from "drizzle-orm";

export class FeedRepository {
    // 1. Bulk Fetch for Hydration pattern
    async findByIds(ids: string[]) {
        if (ids.length === 0) return [];

        const items = await db
            .select({
                id: posts.id,
                userId: posts.userId,
                content: posts.content,
                mediaUrls: posts.mediaUrls,
                pollId: posts.pollId,
                createdAt: posts.createdAt,
                updatedAt: posts.updatedAt,
                publishedAt: posts.publishedAt,
                user: {
                    id: users.id,
                    username: users.username,
                    name: users.name,
                    avatarUrl: users.avatarUrl,
                },
                likesCount: posts.likesCount,
                commentsCount: posts.commentsCount,
            })
            .from(posts)
            .innerJoin(users, eq(posts.userId, users.id))
            .where(inArray(posts.id, ids));

        // Hydrate polls
        const postsWithPolls = await Promise.all(items.map(async (item) => {
            if (!item.pollId) return { ...item, poll: null };

            const [pollData] = await db.select().from(polls).where(eq(polls.id, item.pollId));
            if (!pollData) return { ...item, poll: null };

            const options = await db.select().from(pollOptions).where(eq(pollOptions.pollId, item.pollId));

            return {
                ...item,
                poll: {
                    ...pollData,
                    options,
                }
            };
        }));

        return postsWithPolls;
    }

    // 2. Hybrid model: Fetch posts from followed celebrities (Pull model)
    async getCelebrityPosts(userId: string, limit: number, cursor?: string) {
        // Find users I follow who are celebrities
        const celebritySubquery = db
            .select({ followingId: follows.followingId })
            .from(follows)
            .innerJoin(celebrityAccounts, eq(follows.followingId, celebrityAccounts.userId))
            .where(eq(follows.followerId, userId));

        const items = await db
            .select({
                id: posts.id,
                userId: posts.userId,
                content: posts.content,
                mediaUrls: posts.mediaUrls,
                pollId: posts.pollId,
                createdAt: posts.createdAt,
                updatedAt: posts.updatedAt,
                publishedAt: posts.publishedAt,
                user: {
                    id: users.id,
                    username: users.username,
                    name: users.name,
                    avatarUrl: users.avatarUrl,
                },
                likesCount: posts.likesCount,
                commentsCount: posts.commentsCount,
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

        const withPolls = await Promise.all(items.map(async (item) => {
            if (!item.pollId) return { ...item, poll: null };
            const [pollData] = await db.select().from(polls).where(eq(polls.id, item.pollId));
            if (!pollData) return { ...item, poll: null };
            const options = await db.select().from(pollOptions).where(eq(pollOptions.pollId, item.pollId));
            return { ...item, poll: { ...pollData, options } };
        }));

        return withPolls;
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

        const items = await db
            .select({
                id: posts.id,
                userId: posts.userId,
                content: posts.content,
                mediaUrls: posts.mediaUrls,
                pollId: posts.pollId,
                createdAt: posts.createdAt,
                updatedAt: posts.updatedAt,
                publishedAt: posts.publishedAt,
                user: {
                    id: users.id,
                    username: users.username,
                    name: users.name,
                    avatarUrl: users.avatarUrl,
                },
                likesCount: posts.likesCount,
                commentsCount: posts.commentsCount,
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

        const withPolls = await Promise.all(items.map(async (item) => {
            if (!item.pollId) return { ...item, poll: null };
            const [pollData] = await db.select().from(polls).where(eq(polls.id, item.pollId));
            if (!pollData) return { ...item, poll: null };
            const options = await db.select().from(pollOptions).where(eq(pollOptions.pollId, item.pollId));
            return { ...item, poll: { ...pollData, options } };
        }));

        return withPolls;
    }

    // 7. Global Explore Feed
    async getExploreFeed(limit: number, cursor?: string) {
        const items = await db
            .select({
                id: posts.id,
                userId: posts.userId,
                content: posts.content,
                mediaUrls: posts.mediaUrls,
                pollId: posts.pollId,
                createdAt: posts.createdAt,
                updatedAt: posts.updatedAt,
                publishedAt: posts.publishedAt,
                user: {
                    id: users.id,
                    username: users.username,
                    name: users.name,
                    avatarUrl: users.avatarUrl,
                },
                likesCount: posts.likesCount,
                commentsCount: posts.commentsCount,
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

        const withPolls = await Promise.all(items.map(async (item) => {
            if (!item.pollId) return { ...item, poll: null };
            const [pollData] = await db.select().from(polls).where(eq(polls.id, item.pollId));
            if (!pollData) return { ...item, poll: null };
            const options = await db.select().from(pollOptions).where(eq(pollOptions.pollId, item.pollId));
            return { ...item, poll: { ...pollData, options } };
        }));

        return withPolls;
    }

    // 8. Hashtag Feed
    async getHashtagFeed(tag: string, limit: number, cursor?: string) {
        const items = await db
            .select({
                id: posts.id,
                userId: posts.userId,
                content: posts.content,
                mediaUrls: posts.mediaUrls,
                pollId: posts.pollId,
                createdAt: posts.createdAt,
                updatedAt: posts.updatedAt,
                publishedAt: posts.publishedAt,
                user: {
                    id: users.id,
                    username: users.username,
                    name: users.name,
                    avatarUrl: users.avatarUrl,
                },
                likesCount: posts.likesCount,
                commentsCount: posts.commentsCount,
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

        const withPolls = await Promise.all(items.map(async (item) => {
            if (!item.pollId) return { ...item, poll: null };
            const [pollData] = await db.select().from(polls).where(eq(polls.id, item.pollId));
            if (!pollData) return { ...item, poll: null };
            const options = await db.select().from(pollOptions).where(eq(pollOptions.pollId, item.pollId));
            return { ...item, poll: { ...pollData, options } };
        }));

        return withPolls;
    }
}
