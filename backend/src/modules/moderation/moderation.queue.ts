/**
 * Moderation Priority Queue — Redis Sorted Set Implementation
 * 
 * Uses Redis ZSET for O(log N) priority-based operations.
 * Priority = risk_score * 0.4 + report_count * 0.3 + recency * 0.2 + trust_score * 0.1
 * 
 * Queue key: mod:queue:{category}
 * Score: computed priority (higher = more urgent)
 * Member: postId
 */

import { redis } from "../../config/redis.js";

const QUEUE_KEY = "mod:queue:pending";
const QUEUE_METADATA_PREFIX = "mod:queue:meta:";

export interface QueueItem {
    postId: string;
    priority: number;
    enqueuedAt: number;
    category?: string | undefined;
    riskScore?: number | undefined;
    reportCount?: number | undefined;
}

export interface QueueMetadata {
    postId: string;
    authorId: string;
    category: string;
    riskScore: number;
    reportCount: number;
    enqueuedAt: number;
    contentPreview: string;
}

// ─── Priority Calculation ────────────────────────────────

export function calculatePriority(params: {
    riskScore: number;      // 0-100 (AI-assigned or rule-based)
    reportCount: number;    // Number of reports
    createdAt: Date;        // Post creation time  
    authorTrustScore?: number; // 0-100 (higher = more trusted)
}): number {
    const { riskScore, reportCount, createdAt, authorTrustScore = 50 } = params;

    // Recency weight: newer posts get higher priority
    const ageMinutes = (Date.now() - createdAt.getTime()) / (1000 * 60);
    const recencyWeight = Math.max(0, 100 - ageMinutes * 0.1); // Decays over ~16 hours

    // Inverse trust: lower trust = higher priority
    const trustWeight = 100 - authorTrustScore;

    // Weighted composite score
    const priority =
        riskScore * 0.4 +
        Math.min(reportCount * 10, 100) * 0.3 + // Cap report contribution
        recencyWeight * 0.2 +
        trustWeight * 0.1;

    return Math.round(priority * 100) / 100; // 2 decimal precision
}

// ─── Queue Operations ────────────────────────────────────

/**
 * Add a post to the moderation queue with computed priority.
 */
export async function enqueue(
    postId: string,
    metadata: Omit<QueueMetadata, "postId" | "enqueuedAt">
): Promise<void> {
    const priority = calculatePriority({
        riskScore: metadata.riskScore,
        reportCount: metadata.reportCount,
        createdAt: new Date(),
        authorTrustScore: 50, // Default; can be fetched from user profile
    });

    const queueMetadata: QueueMetadata = {
        postId,
        enqueuedAt: Date.now(),
        ...metadata,
    };

    // Atomic: add to sorted set + store metadata
    const pipeline = redis.pipeline();
    pipeline.zadd(QUEUE_KEY, priority, postId);
    pipeline.set(
        `${QUEUE_METADATA_PREFIX}${postId}`,
        JSON.stringify(queueMetadata),
        "EX",
        86400 * 7 // 7 day TTL on metadata
    );
    await pipeline.exec();
}

/**
 * Remove a post from the moderation queue.
 */
export async function dequeue(postId: string): Promise<void> {
    const pipeline = redis.pipeline();
    pipeline.zrem(QUEUE_KEY, postId);
    pipeline.del(`${QUEUE_METADATA_PREFIX}${postId}`);
    await pipeline.exec();
}

/**
 * Get the next N items from the queue (highest priority first).
 */
export async function peek(count: number = 20): Promise<QueueItem[]> {
    // ZREVRANGE returns highest scores first
    const results = await redis.zrevrange(QUEUE_KEY, 0, count - 1, "WITHSCORES");

    const items: QueueItem[] = [];
    for (let i = 0; i < results.length; i += 2) {
        const postId = results[i]!;
        const priority = parseFloat(results[i + 1]!);

        // Fetch metadata
        const metaRaw = await redis.get(`${QUEUE_METADATA_PREFIX}${postId}`);
        const meta = metaRaw ? JSON.parse(metaRaw) as QueueMetadata : null;

        items.push({
            postId,
            priority,
            enqueuedAt: meta?.enqueuedAt || 0,
            category: meta?.category,
            riskScore: meta?.riskScore,
            reportCount: meta?.reportCount,
        });
    }

    return items;
}

/**
 * Get current queue depth (total items pending).
 */
export async function getQueueDepth(): Promise<number> {
    return redis.zcard(QUEUE_KEY);
}

/**
 * Get queue depth by priority range (for monitoring).
 */
export async function getQueueDepthByPriority(): Promise<{
    critical: number;  // priority >= 80
    high: number;      // priority >= 60
    medium: number;    // priority >= 40
    low: number;       // priority < 40
}> {
    const [critical, high, medium, total] = await Promise.all([
        redis.zcount(QUEUE_KEY, 80, "+inf"),
        redis.zcount(QUEUE_KEY, 60, 79.99),
        redis.zcount(QUEUE_KEY, 40, 59.99),
        redis.zcard(QUEUE_KEY),
    ]);

    return {
        critical,
        high,
        medium,
        low: total - critical - high - medium,
    };
}

/**
 * Update priority for an existing queue item (e.g., after new report).
 */
export async function updatePriority(
    postId: string,
    newPriority: number
): Promise<void> {
    // Only update if item exists in queue
    const score = await redis.zscore(QUEUE_KEY, postId);
    if (score !== null) {
        await redis.zadd(QUEUE_KEY, newPriority, postId);
    }
}

/**
 * Get metadata for a specific queued post.
 */
export async function getQueueItemMetadata(postId: string): Promise<QueueMetadata | null> {
    const raw = await redis.get(`${QUEUE_METADATA_PREFIX}${postId}`);
    return raw ? JSON.parse(raw) as QueueMetadata : null;
}

/**
 * Get average wait time for items in the queue (monitoring metric).
 */
export async function getAverageWaitTime(): Promise<number> {
    const items = await peek(100);
    if (items.length === 0) return 0;

    const now = Date.now();
    const totalWait = items.reduce((sum, item) => sum + (now - item.enqueuedAt), 0);
    return Math.round(totalWait / items.length / 1000); // seconds
}
