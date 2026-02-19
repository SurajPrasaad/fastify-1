import { db } from "../../config/drizzle.js"; // Assuming Drizzle ORM setup
import { sessions, users, identityProviders, mfaSecrets, userCounters } from "../../db/schema.js"; // Assuming users table schema
import { eq, desc, and, sql } from "drizzle-orm";
import type { RegisterDto } from "./auth.dto.js";

export class AuthRepository {
    async createUser(data: RegisterDto & { passwordHash: string }) {
        return await db.transaction(async (tx) => {
            const [user] = await tx
                .insert(users)
                .values({
                    email: data.email,
                    username: data.username,
                    name: data.name,
                    password: data.passwordHash,
                })
                .returning();

            if (!user) {
                throw new Error("Failed to create user");
            }

            await tx.insert(userCounters).values({ userId: user.id });

            return {
                ...user,
                followersCount: 0,
                followingCount: 0,
                postsCount: 0
            };
        });
    }

    async findUserByEmail(email: string) {
        const result = await db
            .select({
                user: users,
                counters: userCounters,
            })
            .from(users)
            .leftJoin(userCounters, eq(users.id, userCounters.userId))
            .where(eq(users.email, email))
            .limit(1);

        const first = result[0];
        if (!first) return null;

        const { user, counters } = first;
        return {
            ...user,
            followersCount: counters?.followersCount ?? 0,
            followingCount: counters?.followingCount ?? 0,
            postsCount: counters?.postsCount ?? 0,
        };
    }

    async findUserById(id: string) {
        const result = await db
            .select({
                user: users,
                counters: userCounters,
            })
            .from(users)
            .leftJoin(userCounters, eq(users.id, userCounters.userId))
            .where(eq(users.id, id))
            .limit(1);

        const first = result[0];
        if (!first) return null;

        const { user, counters } = first;
        return {
            ...user,
            followersCount: counters?.followersCount ?? 0,
            followingCount: counters?.followingCount ?? 0,
            postsCount: counters?.postsCount ?? 0,
        };
    }

    async createSession(data: { userId: string, refreshTokenHash: string, deviceId: string, ip?: string, ua?: string, expiresAt: Date }) {
        const [session] = await db
            .insert(sessions)
            .values({
                userId: data.userId,
                refreshTokenHash: data.refreshTokenHash,
                deviceId: data.deviceId,
                ipAddress: data.ip,
                userAgent: data.ua,
                expiresAt: data.expiresAt,
            })
            .returning();
        return session;
    }

    async findSessionByHash(refreshTokenHash: string) {
        const [session] = await db
            .select()
            .from(sessions)
            .where(eq(sessions.refreshTokenHash, refreshTokenHash))
            .limit(1);
        return session;
    }

    async revokeSession(sessionId: string) {
        await db
            .delete(sessions)
            .where(eq(sessions.id, sessionId));
    }

    async revokeAllUserSessions(userId: string) {
        await db
            .delete(sessions)
            .where(eq(sessions.userId, userId));
    }
    async createMFASecret(userId: string, secret: string, backupCodes: string[]) {
        await db
            .insert(mfaSecrets)
            .values({
                userId,
                secret,
                backupCodes,
                isEnabled: false,
            })
            .onConflictDoUpdate({
                target: mfaSecrets.userId,
                set: { secret, backupCodes, isEnabled: false }
            });
    }

    async findMFASecret(userId: string) {
        const [record] = await db
            .select()
            .from(mfaSecrets)
            .where(eq(mfaSecrets.userId, userId))
            .limit(1);
        return record;
    }

    async enableMFA(userId: string) {
        await db
            .update(mfaSecrets)
            .set({ isEnabled: true })
            .where(eq(mfaSecrets.userId, userId));
    }

    async deleteMFASecret(userId: string) {
        await db
            .delete(mfaSecrets)
            .where(eq(mfaSecrets.userId, userId));
    }

    async countActiveSessions(userId: string) {
        const result = await db
            .select({ count: sessions.id }) // Select ID to count
            .from(sessions)
            .where(eq(sessions.userId, userId));
        return result.length; // Array length is the count
    }

    async getLastLoginTime(userId: string) {
        const [session] = await db
            .select({ createdAt: sessions.createdAt })
            .from(sessions)
            .where(eq(sessions.userId, userId))
            .orderBy(desc(sessions.createdAt))
            .limit(1);
        return session?.createdAt;
    }

    // Simpler separate replacement for imports and then implementation to avoid import errors if I do it all at once without imports.
    // Actually I will do it in one go if I see imports.
    // I see `eq` is imported. I need `desc` from drizzle-orm.

    async findIdentityProviders(userId: string) {
        const providers = await db
            .select({ provider: identityProviders.provider })
            .from(identityProviders)
            .where(eq(identityProviders.userId, userId));
        return providers;
    }

    async markEmailAsVerified(userId: string) {
        await db
            .update(users)
            .set({ isEmailVerified: true })
            .where(eq(users.id, userId));
    }

    async findUserByProvider(provider: "GOOGLE", providerId: string) {
        const result = await db
            .select({
                user: users,
                counters: userCounters
            })
            .from(identityProviders)
            .innerJoin(users, eq(identityProviders.userId, users.id))
            .leftJoin(userCounters, eq(users.id, userCounters.userId))
            .where(
                and(
                    eq(identityProviders.provider, provider),
                    eq(identityProviders.providerId, providerId)
                )
            );

        const first = result[0];
        if (!first) return null;

        const { user, counters } = first;
        return {
            ...user,
            followersCount: counters?.followersCount ?? 0,
            followingCount: counters?.followingCount ?? 0,
            postsCount: counters?.postsCount ?? 0,
        };
    }

    async createGoogleUser(data: { email: string, name: string, username: string, providerId: string, picture?: string }) {
        // Transaction to create user and identity provider
        return await db.transaction(async (tx) => {
            const [user] = await tx
                .insert(users)
                .values({
                    email: data.email,
                    username: data.username,
                    name: data.name,
                    isEmailVerified: true, // Google verified
                })
                .returning();

            if (!user) {
                throw new Error("Failed to create user via Google provider");
            }

            await tx.insert(identityProviders).values({
                userId: user.id,
                provider: "GOOGLE",
                providerId: data.providerId,
            });

            await tx.insert(userCounters).values({ userId: user.id });

            return {
                ...user,
                followersCount: 0,
                followingCount: 0,
                postsCount: 0
            };
        });
    }

    async addProviderToUser(userId: string, provider: "GOOGLE", providerId: string) {
        await db.insert(identityProviders).values({
            userId,
            provider,
            providerId
        });
    }
}
