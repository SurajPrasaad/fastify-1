import { db } from "../../config/drizzle.js";
import { users, follows, userCounters } from "../../db/schema.js";
import { eq, sql, and, inArray } from "drizzle-orm";
import { AppError } from "../../utils/AppError.js";

export class UserRepository {
    async create(data: typeof users.$inferInsert) {
        return await db.transaction(async (tx) => {
            const [user] = await tx.insert(users).values(data).returning();
            if (!user) throw new Error("Failed to create user");

            await tx.insert(userCounters).values({ userId: user.id });

            return {
                ...user,
                followersCount: 0,
                followingCount: 0,
                postsCount: 0
            };
        });
    }

    async findByUsername(username: string) {
        const result = await db
            .select({
                user: users,
                counters: userCounters,
            })
            .from(users)
            .leftJoin(userCounters, eq(users.id, userCounters.userId))
            .where(eq(users.username, username))
            .limit(1);

        if (result.length === 0) return null;

        const row = result[0];
        if (!row) return null;

        const { user, counters } = row;
        return {
            ...user,
            followersCount: counters?.followersCount ?? 0,
            followingCount: counters?.followingCount ?? 0,
            postsCount: counters?.postsCount ?? 0,
        };
    }

    async findById(id: string) {
        const result = await db
            .select({
                user: users,
                counters: userCounters,
            })
            .from(users)
            .leftJoin(userCounters, eq(users.id, userCounters.userId))
            .where(eq(users.id, id))
            .limit(1);

        const row = result[0];
        if (!row) return null;

        const { user, counters } = row;
        return {
            ...user,
            followersCount: counters?.followersCount ?? 0,
            followingCount: counters?.followingCount ?? 0,
            postsCount: counters?.postsCount ?? 0,
        };
    }

    async findByIds(ids: string[]) {
        if (!ids.length) return [];

        const result = await db
            .select({
                user: users,
                counters: userCounters,
            })
            .from(users)
            .leftJoin(userCounters, eq(users.id, userCounters.userId))
            .where(inArray(users.id, ids));

        return result.map(({ user, counters }) => ({
            ...user,
            followersCount: counters?.followersCount ?? 0,
            followingCount: counters?.followingCount ?? 0,
            postsCount: counters?.postsCount ?? 0,
        }));
    }

    // Transactional Follow Logic with Counter Aggregation
    async followUser(followerId: string, followingId: string) {
        return await db.transaction(async (tx) => {
            // 1. Check if already following
            const [existingFollow] = await tx
                .select()
                .from(follows)
                .where(
                    and(
                        eq(follows.followerId, followerId),
                        eq(follows.followingId, followingId)
                    )
                )
                .limit(1);

            if (existingFollow) {
                throw new AppError("Already following this user", 400);
            }

            // 2. Insert into follows table
            await tx.insert(follows).values({
                followerId,
                followingId,
                status: "ACCEPTED", // Defaulting to accepted for now
            });

            // 3. Upsert Counters - Principal Pattern: Use a dedicated counters table 
            // to avoid locking the main 'users' table during high-frequency social actions.

            // Increment following count for actor
            await tx
                .insert(userCounters)
                .values({ userId: followerId, followingCount: 1 })
                .onConflictDoUpdate({
                    target: userCounters.userId,
                    set: { followingCount: sql`${userCounters.followingCount} + 1` }
                });

            // Increment followers count for target
            await tx
                .insert(userCounters)
                .values({ userId: followingId, followersCount: 1 })
                .onConflictDoUpdate({
                    target: userCounters.userId,
                    set: { followersCount: sql`${userCounters.followersCount} + 1` }
                });

            // Principal Engineer Note: For a celebrity like @actor, these DB updates 
            // would be moved to a background Kafka consumer to prevent DB contention.

            return { success: true };
        });
    }

    async unfollowUser(followerId: string, followingId: string) {
        return await db.transaction(async (tx) => {
            const [deleted] = await tx
                .delete(follows)
                .where(
                    and(
                        eq(follows.followerId, followerId),
                        eq(follows.followingId, followingId)
                    )
                )
                .returning();

            if (!deleted) {
                throw new AppError("Not following this user", 400);
            }

            await tx
                .update(userCounters)
                .set({ followingCount: sql`${userCounters.followingCount} - 1` })
                .where(eq(userCounters.userId, followerId));

            await tx
                .update(userCounters)
                .set({ followersCount: sql`${userCounters.followersCount} - 1` })
                .where(eq(userCounters.userId, followingId));

            return { success: true };
        });
    }

    // JSONB Query: Find users by tech stack
    // Uses PostgreSQL operator ? via sql templating
    async findByTechStack(tech: string) {
        const result = await db
            .select({
                user: users,
                counters: userCounters,
            })
            .from(users)
            .leftJoin(userCounters, eq(users.id, userCounters.userId))
            .where(sql`${users.techStack} ? ${tech}`);

        return result.map(({ user, counters }) => ({
            ...user,
            followersCount: counters?.followersCount ?? 0,
            followingCount: counters?.followingCount ?? 0,
            postsCount: counters?.postsCount ?? 0,
        }));
    }

    // Suggest users based on shared tech stack
    async suggestUsers(userId: string, techStack: string[]) {
        if (!techStack.length) return [];

        // Check if techStack contains any of the user's tech using ?| operator
        const query = sql`${users.techStack} ?| ${techStack} AND ${users.id} != ${userId}`;

        return await db
            .select()
            .from(users)
            .where(query)
            .limit(10);
    }

    async isFollowing(followerId: string, followingId: string) {
        const [follow] = await db
            .select()
            .from(follows)
            .where(
                and(
                    eq(follows.followerId, followerId),
                    eq(follows.followingId, followingId),
                    eq(follows.status, "ACCEPTED")
                )
            )
            .limit(1);
        return !!follow;
    }

    async findAll(limit: number = 20, offset: number = 0) {
        const result = await db
            .select({
                user: users,
                counters: userCounters,
            })
            .from(users)
            .leftJoin(userCounters, eq(users.id, userCounters.userId))
            .limit(limit)
            .offset(offset);

        return result.map(({ user, counters }) => ({
            ...user,
            followersCount: counters?.followersCount ?? 0,
            followingCount: counters?.followingCount ?? 0,
            postsCount: counters?.postsCount ?? 0,
        }));
    }

    async update(id: string, data: Partial<typeof users.$inferInsert>) {
        const [user] = await db
            .update(users)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning();

        if (!user) return null;

        const [counters] = await db
            .select()
            .from(userCounters)
            .where(eq(userCounters.userId, id))
            .limit(1);

        return {
            ...user,
            followersCount: counters?.followersCount ?? 0,
            followingCount: counters?.followingCount ?? 0,
            postsCount: counters?.postsCount ?? 0,
        };
    }
    async getFollowers(userId: string, limit: number, offset: number) {
        const result = await db
            .select({
                user: users,
                counters: userCounters,
                // Check if the target of the query (the follower) is followed by the viewer (context needed, handling simply for now)
            })
            .from(follows)
            .innerJoin(users, eq(follows.followerId, users.id))
            .leftJoin(userCounters, eq(users.id, userCounters.userId))
            .where(eq(follows.followingId, userId))
            .limit(limit)
            .offset(offset);

        return result.map(({ user, counters }) => ({
            ...user,
            followersCount: counters?.followersCount ?? 0,
            followingCount: counters?.followingCount ?? 0,
            postsCount: counters?.postsCount ?? 0,
        }));
    }

    async getFollowing(userId: string, limit: number, offset: number) {
        const result = await db
            .select({
                user: users,
                counters: userCounters,
            })
            .from(follows)
            .innerJoin(users, eq(follows.followingId, users.id))
            .leftJoin(userCounters, eq(users.id, userCounters.userId))
            .where(eq(follows.followerId, userId))
            .limit(limit)
            .offset(offset);

        return result.map(({ user, counters }) => ({
            ...user,
            followersCount: counters?.followersCount ?? 0,
            followingCount: counters?.followingCount ?? 0,
            postsCount: counters?.postsCount ?? 0,
        }));
    }
    async findFollowedIds(followerId: string, targetIds: string[]) {
        if (!targetIds.length) return new Set<string>();

        const result = await db
            .select({ followingId: follows.followingId })
            .from(follows)
            .where(
                and(
                    eq(follows.followerId, followerId),
                    inArray(follows.followingId, targetIds),
                    eq(follows.status, "ACCEPTED")
                )
            );

        return new Set(result.map(r => r.followingId));
    }
}
