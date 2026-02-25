import { db } from "../../config/drizzle.js";
import { users, follows, userCounters, userPrivacy, sessions, mfaSecrets, identityProviders, notificationSettings } from "../../db/schema.js";
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
    async suggestUsers(userId: string, techStack: string[], limit: number = 10) {
        if (!techStack.length) return [];

        // Check if techStack contains any of the user's tech using ?| operator
        // We use sql.join and array[] to prevent Drizzle from expanding techStack into ($1, $2, ...)
        const query = sql`${users.techStack} ?| array[${sql.join(techStack.map(t => sql`${t}`), sql`, `)}] AND ${users.id} != ${userId}`;

        return await db
            .select()
            .from(users)
            .where(query)
            .limit(limit);
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

    async getFollowedUserIds(userId: string): Promise<string[]> {
        const result = await db
            .select({ followingId: follows.followingId })
            .from(follows)
            .where(and(eq(follows.followerId, userId), eq(follows.status, "ACCEPTED")));
        return result.map(r => r.followingId);
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

    async getPrivacy(userId: string) {
        const [privacy] = await db
            .select()
            .from(userPrivacy)
            .where(eq(userPrivacy.userId, userId))
            .limit(1);

        if (!privacy) {
            // Create default privacy if not exists
            const [newPrivacy] = await db
                .insert(userPrivacy)
                .values({ userId })
                .returning();
            return newPrivacy;
        }

        return privacy;
    }

    async updatePrivacy(userId: string, data: Partial<typeof userPrivacy.$inferInsert>) {
        const [privacy] = await db
            .update(userPrivacy)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(userPrivacy.userId, userId))
            .returning();
        return privacy;
    }
    async getSecurityOverview(userId: string) {
        const [user] = await db
            .select({ passwordChangedAt: users.passwordChangedAt })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        const [mfa] = await db
            .select({ isEnabled: mfaSecrets.isEnabled })
            .from(mfaSecrets)
            .where(eq(mfaSecrets.userId, userId))
            .limit(1);

        const userSessions = await db
            .select()
            .from(sessions)
            .where(and(eq(sessions.userId, userId), eq(sessions.isValid, true)))
            .orderBy(sql`${sessions.lastActiveAt} DESC`);

        const apps = await db
            .select()
            .from(identityProviders)
            .where(eq(identityProviders.userId, userId));

        return {
            passwordMetadata: {
                lastChangedAt: user?.passwordChangedAt ?? null,
            },
            mfaStatus: {
                isEnabled: mfa?.isEnabled ?? false,
            },
            sessions: userSessions,
            connectedApps: apps,
        };
    }

    async revokeSession(userId: string, sessionId: string) {
        return await db
            .update(sessions)
            .set({ isValid: false })
            .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));
    }

    async revokeApp(userId: string, appId: string) {
        return await db
            .delete(identityProviders)
            .where(and(eq(identityProviders.id, appId), eq(identityProviders.userId, userId)));
    }

    async getNotificationSettings(userId: string) {
        const [settings] = await db
            .select()
            .from(notificationSettings)
            .where(eq(notificationSettings.userId, userId))
            .limit(1);

        if (!settings) {
            // Create default settings if not exists
            const [newSettings] = await db
                .insert(notificationSettings)
                .values({ userId })
                .returning();
            return newSettings;
        }

        return settings;
    }

    async updateNotificationSettings(userId: string, data: any) {
        const [settings] = await db
            .update(notificationSettings)
            .set({ ...data })
            .where(eq(notificationSettings.userId, userId))
            .returning();

        return settings;
    }
}
