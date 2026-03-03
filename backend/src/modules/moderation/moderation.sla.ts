/**
 * Moderation SLA — Redis-backed SLA tracking
 *
 * When a post enters the queue, we set a deadline (e.g. 2 hours).
 * Keys: mod:sla:{postId} = deadline timestamp (ms)
 * Used for: breach detection, dashboard metrics, alerts.
 */

import { redis } from "../../config/redis.js";

const SLA_PREFIX = "mod:sla:";
const DEFAULT_SLA_HOURS = 2;
const SLA_TTL_DAYS = 7; // Keep key for 7 days then expire

export function getSlaDeadlineMs(hours: number = DEFAULT_SLA_HOURS): number {
    return Date.now() + hours * 60 * 60 * 1000;
}

/**
 * Set SLA deadline when a post is enqueued.
 */
export async function setSlaDeadline(postId: string, deadlineMs?: number): Promise<void> {
    const deadline = deadlineMs ?? getSlaDeadlineMs();
    const key = `${SLA_PREFIX}${postId}`;
    await redis.set(key, String(deadline), "EX", SLA_TTL_DAYS * 86400);
}

/**
 * Remove SLA key when post is dequeued (approved/rejected).
 */
export async function clearSlaDeadline(postId: string): Promise<void> {
    await redis.del(`${SLA_PREFIX}${postId}`);
}

/**
 * Get remaining time until SLA breach (ms). Negative = breached.
 */
export async function getSlaRemainingMs(postId: string): Promise<number | null> {
    const raw = await redis.get(`${SLA_PREFIX}${postId}`);
    if (!raw) return null;
    const deadline = parseInt(raw, 10);
    if (Number.isNaN(deadline)) return null;
    return deadline - Date.now();
}

/**
 * Check if post has breached SLA.
 */
export async function isSlaBreached(postId: string): Promise<boolean> {
    const remaining = await getSlaRemainingMs(postId);
    return remaining !== null && remaining < 0;
}

/**
 * Count how many queued posts (in Redis queue) have breached SLA.
 * Requires iterating queue members and checking each mod:sla:*.
 */
export async function getBreachedPostIds(postIds: string[]): Promise<string[]> {
    if (postIds.length === 0) return [];
    const keys = postIds.map((id) => `${SLA_PREFIX}${id}`);
    const values = await redis.mget(...keys);
    const now = Date.now();
    const breached: string[] = [];
    values.forEach((raw, i) => {
        if (!raw) return;
        const deadline = parseInt(raw, 10);
        if (!Number.isNaN(deadline) && deadline < now) {
            breached.push(postIds[i]!);
        }
    });
    return breached;
}
