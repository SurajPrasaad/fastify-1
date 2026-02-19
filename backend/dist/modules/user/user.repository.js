import { db } from "../../config/drizzle.js";
import { users, follows, userCounters } from "../../db/schema.js";
import { eq, sql, and } from "drizzle-orm";
import { AppError } from "../../utils/AppError.js";
export class UserRepository {
    async create(data) {
        return await db.transaction(async (tx) => {
            const [user] = await tx.insert(users).values(data).returning();
            if (!user)
                throw new Error("Failed to create user");
            await tx.insert(userCounters).values({ userId: user.id });
            return {
                ...user,
                followersCount: 0,
                followingCount: 0,
                postsCount: 0
            };
        });
    }
    async findByUsername(username) {
        const result = await db
            .select({
            user: users,
            counters: userCounters,
        })
            .from(users)
            .leftJoin(userCounters, eq(users.id, userCounters.userId))
            .where(eq(users.username, username))
            .limit(1);
        if (result.length === 0)
            return null;
        const row = result[0];
        if (!row)
            return null;
        const { user, counters } = row;
        return {
            ...user,
            followersCount: counters?.followersCount ?? 0,
            followingCount: counters?.followingCount ?? 0,
            postsCount: counters?.postsCount ?? 0,
        };
    }
    async findById(id) {
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
        if (!row)
            return null;
        const { user, counters } = row;
        return {
            ...user,
            followersCount: counters?.followersCount ?? 0,
            followingCount: counters?.followingCount ?? 0,
            postsCount: counters?.postsCount ?? 0,
        };
    }
    // Transactional Follow Logic with Counter Aggregation
    async followUser(followerId, followingId) {
        return await db.transaction(async (tx) => {
            // 1. Check if already following
            const [existingFollow] = await tx
                .select()
                .from(follows)
                .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
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
                set: { followingCount: sql `${userCounters.followingCount} + 1` }
            });
            // Increment followers count for target
            await tx
                .insert(userCounters)
                .values({ userId: followingId, followersCount: 1 })
                .onConflictDoUpdate({
                target: userCounters.userId,
                set: { followersCount: sql `${userCounters.followersCount} + 1` }
            });
            // Principal Engineer Note: For a celebrity like @actor, these DB updates 
            // would be moved to a background Kafka consumer to prevent DB contention.
            return { success: true };
        });
    }
    async unfollowUser(followerId, followingId) {
        return await db.transaction(async (tx) => {
            const [deleted] = await tx
                .delete(follows)
                .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
                .returning();
            if (!deleted) {
                throw new AppError("Not following this user", 400);
            }
            await tx
                .update(userCounters)
                .set({ followingCount: sql `${userCounters.followingCount} - 1` })
                .where(eq(userCounters.userId, followerId));
            await tx
                .update(userCounters)
                .set({ followersCount: sql `${userCounters.followersCount} - 1` })
                .where(eq(userCounters.userId, followingId));
            return { success: true };
        });
    }
    // JSONB Query: Find users by tech stack
    // Uses PostgreSQL operator ? via sql templating
    async findByTechStack(tech) {
        const result = await db
            .select({
            user: users,
            counters: userCounters,
        })
            .from(users)
            .leftJoin(userCounters, eq(users.id, userCounters.userId))
            .where(sql `${users.techStack} ? ${tech}`);
        return result.map(({ user, counters }) => ({
            ...user,
            followersCount: counters?.followersCount ?? 0,
            followingCount: counters?.followingCount ?? 0,
            postsCount: counters?.postsCount ?? 0,
        }));
    }
    // Suggest users based on shared tech stack
    async suggestUsers(userId, techStack) {
        if (!techStack.length)
            return [];
        // Check if techStack contains any of the user's tech using ?| operator
        const query = sql `${users.techStack} ?| ${techStack} AND ${users.id} != ${userId}`;
        return await db
            .select()
            .from(users)
            .where(query)
            .limit(10);
    }
    async isFollowing(followerId, followingId) {
        const [follow] = await db
            .select()
            .from(follows)
            .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId), eq(follows.status, "ACCEPTED")))
            .limit(1);
        return !!follow;
    }
    async findAll(limit = 20, offset = 0) {
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
    async update(id, data) {
        const [user] = await db
            .update(users)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning();
        if (!user)
            return null;
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
}
//# sourceMappingURL=user.repository.js.map