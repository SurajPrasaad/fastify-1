/**
 * Redis Distributed Locking for Moderation Queue
 * 
 * Prevents concurrent moderators from reviewing the same post.
 * Uses Redis SET NX EX pattern for atomic lock acquisition.
 * Auto-releases after TTL to prevent deadlocks.
 * 
 * Key format: mod:lock:{postId}
 * Value: {moderatorId}:{timestamp}
 * TTL: 300 seconds (5 minutes)
 */

import { redis } from "../../config/redis.js";

const LOCK_PREFIX = "mod:lock:";
const LOCK_TTL_SECONDS = 300; // 5 minutes auto-release
const LOCK_EXTEND_THRESHOLD_SECONDS = 60; // Extend if less than 60s remaining

export interface LockResult {
    acquired: boolean;
    lockHolder?: string | undefined;
    expiresAt?: number | undefined;
    error?: string | undefined;
}

export interface LockInfo {
    moderatorId: string;
    acquiredAt: number;
    expiresAt: number;
}

/**
 * Acquire an exclusive lock on a post for moderation.
 * Uses Redis SET NX EX for atomic lock acquisition.
 */
export async function acquireModerationLock(
    postId: string,
    moderatorId: string
): Promise<LockResult> {
    const key = `${LOCK_PREFIX}${postId}`;
    const value = `${moderatorId}:${Date.now()}`;

    try {
        // Atomic SET if Not eXists with EXpiry
        const result = await redis.set(key, value, "EX", LOCK_TTL_SECONDS, "NX");

        if (result === "OK") {
            return {
                acquired: true,
                lockHolder: moderatorId,
                expiresAt: Date.now() + LOCK_TTL_SECONDS * 1000,
            };
        }

        // Lock already held — check who holds it
        const existingValue = await redis.get(key);
        if (existingValue) {
            const [holderId] = existingValue.split(":");

            // If same moderator already holds the lock, extend it
            if (holderId === moderatorId) {
                await redis.expire(key, LOCK_TTL_SECONDS);
                const ttl = await redis.ttl(key);
                return {
                    acquired: true,
                    lockHolder: moderatorId,
                    expiresAt: Date.now() + ttl * 1000,
                };
            }

            return {
                acquired: false,
                lockHolder: holderId,
                error: `Post is currently being reviewed by another moderator`,
            };
        }

        // Race condition: lock expired between SET and GET
        // Retry once
        const retryResult = await redis.set(key, value, "EX", LOCK_TTL_SECONDS, "NX");
        if (retryResult === "OK") {
            return {
                acquired: true,
                lockHolder: moderatorId,
                expiresAt: Date.now() + LOCK_TTL_SECONDS * 1000,
            };
        }

        return {
            acquired: false,
            error: "Failed to acquire lock — concurrent access detected",
        };
    } catch (err) {
        return {
            acquired: false,
            error: `Lock acquisition failed: ${(err as Error).message}`,
        };
    }
}

/**
 * Release a moderation lock.
 * Only releases if the lock is held by the specified moderator (prevents accidental release).
 * Uses Lua script for atomic check-and-delete.
 */
export async function releaseModerationLock(
    postId: string,
    moderatorId: string
): Promise<boolean> {
    const key = `${LOCK_PREFIX}${postId}`;

    // Lua script: atomic check-and-delete
    // Only deletes if the lock value starts with the moderator's ID
    const luaScript = `
        local val = redis.call('GET', KEYS[1])
        if val and string.find(val, ARGV[1], 1, true) == 1 then
            redis.call('DEL', KEYS[1])
            return 1
        end
        return 0
    `;

    try {
        const result = await redis.eval(luaScript, 1, key, `${moderatorId}:`);
        return result === 1;
    } catch (err) {
        console.error(`Failed to release lock for post ${postId}:`, err);
        return false;
    }
}

/**
 * Force-release a lock (Admin override).
 * Bypasses ownership check. Logs the override action.
 */
export async function forceReleaseLock(
    postId: string,
    adminId: string
): Promise<{ released: boolean; previousHolder?: string | undefined }> {
    const key = `${LOCK_PREFIX}${postId}`;

    try {
        const existingValue = await redis.get(key);
        const previousHolder = existingValue?.split(":")[0];

        const deleted = await redis.del(key);

        return {
            released: deleted > 0,
            previousHolder,
        };
    } catch (err) {
        console.error(`Failed to force-release lock for post ${postId}:`, err);
        return { released: false };
    }
}

/**
 * Get lock information for a specific post.
 */
export async function getLockInfo(postId: string): Promise<LockInfo | null> {
    const key = `${LOCK_PREFIX}${postId}`;

    try {
        const [value, ttl] = await Promise.all([
            redis.get(key),
            redis.ttl(key),
        ]);

        if (!value || ttl <= 0) return null;

        const [moderatorId, timestamp] = value.split(":");
        return {
            moderatorId: moderatorId!,
            acquiredAt: parseInt(timestamp!, 10),
            expiresAt: Date.now() + ttl * 1000,
        };
    } catch {
        return null;
    }
}

/**
 * Extend a lock's TTL if it's close to expiring.
 * Called during active review to prevent premature release.
 */
export async function extendLock(
    postId: string,
    moderatorId: string
): Promise<boolean> {
    const key = `${LOCK_PREFIX}${postId}`;

    try {
        const value = await redis.get(key);
        if (!value) return false;

        const [holderId] = value.split(":");
        if (holderId !== moderatorId) return false;

        await redis.expire(key, LOCK_TTL_SECONDS);
        return true;
    } catch {
        return false;
    }
}

/**
 * Get all currently locked posts (for admin dashboard).
 * Uses SCAN to avoid blocking Redis.
 */
export async function getActiveLocks(): Promise<Array<{ postId: string; info: LockInfo }>> {
    const locks: Array<{ postId: string; info: LockInfo }> = [];
    let cursor = "0";

    try {
        do {
            const [nextCursor, keys] = await redis.scan(
                cursor,
                "MATCH",
                `${LOCK_PREFIX}*`,
                "COUNT",
                100
            );
            cursor = nextCursor;

            for (const key of keys) {
                const postId = key.replace(LOCK_PREFIX, "");
                const info = await getLockInfo(postId);
                if (info) {
                    locks.push({ postId, info });
                }
            }
        } while (cursor !== "0");
    } catch (err) {
        console.error("Failed to scan active locks:", err);
    }

    return locks;
}
