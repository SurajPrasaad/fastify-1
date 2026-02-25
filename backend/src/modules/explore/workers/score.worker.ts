
import { ExploreService } from "../explore.service.js";

/**
 * Score Worker
 * 
 * Kafka consumer that processes engagement events and updates
 * trending scores in Redis sorted sets.
 *
 * Topics consumed:
 * - explore.engagement.updated  (likes, comments, reposts)
 * - explore.post.ingested       (new posts)
 *
 * In production this would be:
 * 1. A separate Kafka consumer group: 'explore-score-workers'
 * 2. Multiple partitioned consumers for horizontal scaling
 * 3. Idempotent operations (ZADD is naturally idempotent)
 * 4. At-least-once delivery with manual offset commits
 *
 * For now: exported functions that can be called from the existing
 * Kafka consumer setup or directly from engagement event handlers.
 */

const exploreService = new ExploreService();

/**
 * Handle engagement event (like, comment, repost created/deleted).
 * Recomputes the trending score for the affected post.
 */
export async function handleEngagementEvent(event: {
    postId: string;
    type: "LIKE" | "COMMENT" | "REPOST" | "VIEW";
    delta: number; // +1 or -1
    userId: string;
    timestamp: number;
}): Promise<void> {
    try {
        // Recompute trending score (idempotent — always reads current counters)
        await exploreService.updatePostScore(event.postId);

        // If this is a meaningful interaction, also update user affinity
        if (event.delta > 0 && event.type !== "VIEW") {
            const action = event.type === "LIKE" ? "LIKE" : event.type === "COMMENT" ? "COMMENT" : "REPOST";
            await exploreService.trackInteraction(event.userId, event.postId, action);
        }
    } catch (err) {
        console.error(`[ScoreWorker] Failed to process engagement event for post ${event.postId}:`, err);
        // In production: send to DLQ after 3 retries
    }
}

/**
 * Handle new post ingestion.
 * Adds the post to trending sorted sets with an initial score.
 */
export async function handlePostCreated(event: {
    postId: string;
    authorId: string;
    tags: string[];
    createdAt: string;
}): Promise<void> {
    try {
        await exploreService.ingestPost(event.postId);
    } catch (err) {
        console.error(`[ScoreWorker] Failed to ingest post ${event.postId}:`, err);
    }
}

/**
 * Handle post deletion or moderation rejection.
 * Removes the post from all trending sorted sets.
 */
export async function handlePostRemoved(event: {
    postId: string;
    reason: "DELETED" | "MODERATED" | "ARCHIVED";
}): Promise<void> {
    try {
        await exploreService.removePost(event.postId);
    } catch (err) {
        console.error(`[ScoreWorker] Failed to remove post ${event.postId}:`, err);
    }
}

/**
 * Handle user interaction for personalization updates.
 */
export async function handleUserInteraction(event: {
    userId: string;
    postId: string;
    action: string;
    duration?: number;
}): Promise<void> {
    try {
        await exploreService.trackInteraction(
            event.userId,
            event.postId,
            event.action,
            event.duration || 0
        );
    } catch (err) {
        console.error(`[ScoreWorker] Failed to process interaction for user ${event.userId}:`, err);
    }
}
