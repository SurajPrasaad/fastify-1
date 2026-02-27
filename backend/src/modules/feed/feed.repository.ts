
import { db } from "../../config/drizzle.js";
import { posts, users, follows, celebrityAccounts, rankingFeatures, polls, pollOptions, hashtags, postHashtags } from "../../db/schema.js";
import { and, desc, eq, inArray, lt, sql, exists, or } from "drizzle-orm";
import { blocks } from "../../db/schema.js";

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
        const tagLower = tag.toLowerCase();
        const tagWithHash = tagLower.startsWith('#') ? tagLower : `#${tagLower}`;
        const tagWithoutHash = tagLower.startsWith('#') ? tagLower.slice(1) : tagLower;

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
            .innerJoin(postHashtags, eq(posts.id, postHashtags.postId))
            .innerJoin(hashtags, eq(postHashtags.hashtagId, hashtags.id))
            .where(
                and(
                    eq(posts.status, 'PUBLISHED'),
                    or(
                        eq(hashtags.name, tagWithoutHash),
                        eq(hashtags.name, tagWithHash),
                        sql`${posts.tags} ? ${tagWithoutHash}`,
                        sql`${posts.tags} ? ${tagWithHash}`
                    ),
                    cursor ? lt(sql`COALESCE(${posts.publishedAt}, ${posts.createdAt})`, new Date(cursor)) : undefined
                )
            )
            .orderBy(desc(sql`COALESCE(${posts.publishedAt}, ${posts.createdAt})`))
            .limit(limit);

        const uniqueItemsMap = new Map();
        for (const item of items) {
            if (!uniqueItemsMap.has(item.id)) {
                uniqueItemsMap.set(item.id, item);
            }
        }
        const uniqueItems = Array.from(uniqueItemsMap.values());

        const withPolls = await Promise.all(uniqueItems.map(async (item) => {
            if (!item.pollId) return { ...item, poll: null };
            const [pollData] = await db.select().from(polls).where(eq(polls.id, item.pollId));
            if (!pollData) return { ...item, poll: null };
            const options = await db.select().from(pollOptions).where(eq(pollOptions.pollId, item.pollId));
            return { ...item, poll: { ...pollData, options } };
        }));

        return withPolls;
    }

    // 9. Filtering: Get IDs of users to exclude (blocked/blocking)
    async getBlockedUserIds(userId: string): Promise<string[]> {
        const result = await db
            .select({
                blockerId: blocks.blockerId,
                blockedId: blocks.blockedId
            })
            .from(blocks)
            .where(
                or(
                    eq(blocks.blockerId, userId),
                    eq(blocks.blockedId, userId)
                )
            );

        return result.map(r => r.blockedId === userId ? r.blockerId! : r.blockedId!);
    }

    // 10. For You: Get trending posts (high engagement)
    async getTrendingPosts(limit: number, excludeIds: string[]) {
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
                    excludeIds.length > 0 ? sql`${posts.id} NOT IN (${sql.join(excludeIds.map(id => sql`${id}`), sql`, `)})` : undefined
                )
            )
            .orderBy(desc(sql`${posts.likesCount} + ${posts.commentsCount} * 2`))
            .limit(limit);

        const uniqueItemsMap = new Map();
        for (const item of items) {
            if (!uniqueItemsMap.has(item.id)) {
                uniqueItemsMap.set(item.id, item);
            }
        }
        return Array.from(uniqueItemsMap.values());
    }
}
