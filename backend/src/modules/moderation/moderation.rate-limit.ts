/**
 * Moderation Action Rate Limit — Abuse prevention
 *
 * Redis key: mod:ratelimit:{moderatorId}:{windowStart}
 * Limit: e.g. 60 actions per minute per moderator (configurable).
 * Prevents mass approvals/rejections in a short time.
 */

import { redis } from "../../config/redis.js";

const RATE_LIMIT_PREFIX = "mod:ratelimit:";
const WINDOW_SECONDS = 60;
const MAX_ACTIONS_PER_WINDOW = 60;

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
}

/**
 * Check and consume one moderation action for the moderator.
 * Returns allowed: false if over limit.
 */
export async function checkModerationRateLimit(moderatorId: string): Promise<RateLimitResult> {
    const windowStart = Math.floor(Date.now() / 1000 / WINDOW_SECONDS) * WINDOW_SECONDS;
    const key = `${RATE_LIMIT_PREFIX}${moderatorId}:${windowStart}`;

    const [count, ttl] = await Promise.all([
        redis.incr(key),
        redis.ttl(key),
    ]);

    if (count === 1) {
        await redis.expire(key, WINDOW_SECONDS);
    }

    const resetAt = (windowStart + WINDOW_SECONDS) * 1000;
    const remaining = Math.max(0, MAX_ACTIONS_PER_WINDOW - count);
    const allowed = count <= MAX_ACTIONS_PER_WINDOW;

    return {
        allowed,
        remaining,
        resetAt,
    };
}
