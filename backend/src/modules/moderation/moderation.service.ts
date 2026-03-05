/**
 * Moderation Service — Business Logic Layer
 * 
 * Orchestrates the pre-moderation workflow:
 * 1. Queue management (priority-based with Redis)
 * 2. Post lifecycle state transitions (state machine validation)
 * 3. Distributed locking (Redis SET NX EX)
 * 4. Event emission (Kafka)
 * 5. Audit logging
 */

import { ModerationRepository } from "./moderation.repository.js";
import { AuditService } from "../audit/audit.service.js";
import { validateTransition, type PostStatus, type ModerationAction } from "../post/post.state-machine.js";
import { acquireModerationLock, releaseModerationLock, forceReleaseLock, getLockInfo, getActiveLocks } from "./moderation.lock.js";
import { checkModerationRateLimit } from "./moderation.rate-limit.js";
import * as queue from "./moderation.queue.js";
import * as events from "./moderation.events.js";
import type { CreateReportInput, ResolveReportInput, ModeratePostInput } from "./moderation.schema.js";
import type { UserRole } from "../../middleware/rbac.js";
import { AppError } from "../../utils/AppError.js";

export class ModerationService {
    private repository = new ModerationRepository();
    private auditService = new AuditService();

    // ─── Report Management ───────────────────────────────

    async createReport(data: CreateReportInput & { reporterId: string }) {
        const report = await this.repository.createReport(data);

        // If report is for a post, update its risk score in the queue
        if (data.postId) {
            queue.enqueue(data.postId, {
                authorId: data.reporterId,
                category: data.category,
                riskScore: 50, // Default; AI scoring would update this
                reportCount: 1,
                contentPreview: data.reason.substring(0, 200),
            }).catch(err => console.error("Queue enqueue failed:", err));
        }

        return report;
    }

    // ─── Moderation Queue ────────────────────────────────

    /**
     * Get posts pending moderation (primary queue view).
     * Uses database query with risk_score sorting + FIFO fallback.
     */
    async getModerationQueue(limit: number = 20, variant?: string) {
        return this.repository.getPendingPosts(limit, variant);
    }

    /**
     * Get legacy report-based queue.
     */
    async getReportQueue(limit: number = 20, moderatorId?: string, category?: string) {
        return this.repository.getReportQueue(limit, moderatorId, category);
    }

    /**
     * Get queue statistics for dashboard.
     */
    async getQueueStats() {
        const [dbStats, queueDepth, avgWaitTime] = await Promise.all([
            this.repository.getQueueStats(),
            queue.getQueueDepth(),
            queue.getAverageWaitTime(),
        ]);

        return {
            ...dbStats,
            redisQueueDepth: queueDepth,
            avgWaitTimeSeconds: avgWaitTime,
        };
    }

    /**
     * Get queue depth by priority (monitoring).
     */
    async getQueueDepthByPriority() {
        return queue.getQueueDepthByPriority();
    }

    // ─── Post Moderation Actions ─────────────────────────

    /**
     * Moderate a post (approve, reject, request revision, etc.).
     * Validates state transition → acquires lock → updates DB → emits events.
     */
    async moderatePost(
        data: ModeratePostInput & { moderatorId: string },
        actorRole: UserRole,
        isOwner: boolean = false,
        requestContext?: { ipAddress?: string; userAgent?: string }
    ) {
        const { postId, action, reason, internalNote, moderatorId } = data;

        // 1. Map action string to ModerationAction type
        const actionMap: Record<string, ModerationAction> = {
            "APPROVE": "APPROVE",
            "REJECT": "REJECT",
            "REQUEST_REVISION": "REQUEST_REVISION",
            "REMOVE": "REMOVE",
            "RESTORE": "RESTORE",
            "ESCALATE": "ESCALATE",
            "FLAG": "FLAG",
        };

        const moderationAction = actionMap[action];
        if (!moderationAction) {
            throw new AppError(`Invalid moderation action: ${action}`, 400);
        }

        // 2. Fetch current post to validate transition
        const pendingPosts = await this.repository.getPendingPosts(1);
        // Actually, let's get the specific post status from DB
        const { db } = await import("../../config/drizzle.js");
        const { posts } = await import("../../db/schema.js");
        const { eq } = await import("drizzle-orm");

        const [post] = await db.select({ status: posts.status, userId: posts.userId })
            .from(posts)
            .where(eq(posts.id, postId))
            .limit(1);

        if (!post) {
            throw new AppError("Post not found", 404);
        }

        // 3. Validate state transition through the state machine
        const transitionResult = validateTransition(
            post.status as PostStatus,
            moderationAction,
            actorRole,
            isOwner || post.userId === moderatorId
        );

        if (!transitionResult.valid) {
            throw new AppError(transitionResult.error || "Invalid state transition", 403);
        }

        // 3b. Rate limit: prevent mass actions
        const rateLimit = await checkModerationRateLimit(moderatorId);
        if (!rateLimit.allowed) {
            throw new AppError("Too many moderation actions; please slow down", 429);
        }

        // 4. Acquire lock (except for ESCALATE which doesn't need exclusive access)
        if (action !== "ESCALATE") {
            const lockResult = await acquireModerationLock(postId, moderatorId);
            if (!lockResult.acquired) {
                throw new AppError(
                    lockResult.error || "Could not acquire lock for moderation",
                    409 // Conflict
                );
            }
        }

        try {
            // 5. Perform the moderation action
            // For APPROVE, we go directly to PUBLISHED (APPROVED → PUBLISHED is automatic)
            const newStatus = action === "APPROVE" ? "PUBLISHED" : transitionResult.newStatus!;

            const result = await this.repository.moderatePost({
                postId,
                action,
                moderatorId,
                newStatus,
                reason,
                internalNote,
            });

            // 6. Remove from Redis queue
            await queue.dequeue(postId);

            // 7. Emit Kafka events (fire-and-forget)
            this.emitModerationEvents(action, postId, moderatorId, reason, post.status, newStatus);

            // 8. Audit log
            this.auditService.logFromRequest(
                moderatorId,
                `POST_${action}`,
                "POST",
                postId,
                {
                    reason,
                    previousState: { status: post.status },
                    newState: { status: newStatus },
                    ipAddress: requestContext?.ipAddress,
                    userAgent: requestContext?.userAgent,
                }
            );

            return result;
        } finally {
            // 6. Release lock (always, even on error)
            if (action !== "ESCALATE") {
                await releaseModerationLock(postId, moderatorId);
            }
        }
    }

    // ─── Locking ─────────────────────────────────────────

    /**
     * Acquire a review lock on a post.
     */
    async lockPost(postId: string, moderatorId: string) {
        return acquireModerationLock(postId, moderatorId);
    }

    /**
     * Release a review lock.
     */
    async unlockPost(postId: string, moderatorId: string) {
        return releaseModerationLock(postId, moderatorId);
    }

    /**
     * Force-release a lock (Admin only).
     */
    async forceUnlockPost(postId: string, adminId: string) {
        return forceReleaseLock(postId, adminId);
    }

    /**
     * Get lock info for a post.
     */
    async getPostLock(postId: string) {
        return getLockInfo(postId);
    }

    /**
     * Get all active locks (for admin dashboard).
     */
    async getActiveReviewLocks() {
        return getActiveLocks();
    }

    // ─── Post History ────────────────────────────────────

    async getPostModerationHistory(postId: string) {
        return this.repository.getPostModerationHistory(postId);
    }

    async getPostReports(postId: string) {
        return this.repository.getPostReports(postId);
    }

    // ─── Moderator Metrics ───────────────────────────────

    async getModeratorMetrics(moderatorId: string, timeRangeHours: number = 24) {
        return this.repository.getModeratorMetrics(moderatorId, timeRangeHours);
    }

    async getRecentActions(moderatorId: string, limit: number = 5, offset: number = 0, action?: string) {
        return this.repository.getRecentActions(moderatorId, limit, offset, action);
    }

    async getModerationSla(timeRangeHours: number = 24) {
        return this.repository.getModerationSlaMetrics(timeRangeHours);
    }

    // ─── Legacy: Report Resolution ───────────────────────

    async resolveReport(
        data: ResolveReportInput & { resolvedById: string },
        auditInfo: { previousState?: unknown; newState?: unknown; ipAddress?: string; userAgent?: string }
    ) {
        const result = await this.repository.resolveReport(data, auditInfo);
        return result;
    }

    async assignTask(queueId: string, moderatorId: string) {
        return this.repository.assignToModerator(queueId, moderatorId);
    }

    // ─── Private Helpers ─────────────────────────────────

    private emitModerationEvents(
        action: string,
        postId: string,
        moderatorId: string,
        reason: string,
        previousStatus: string,
        newStatus: string
    ) {
        switch (action) {
            case "APPROVE":
                events.emitPostApproved(postId, moderatorId, reason, previousStatus);
                events.emitPostPublished(postId, moderatorId);
                break;
            case "REJECT":
                events.emitPostRejected(postId, moderatorId, reason);
                break;
            case "REQUEST_REVISION":
                events.emitRevisionRequested(postId, moderatorId, reason);
                break;
            case "REMOVE":
                events.emitPostRemoved(postId, moderatorId, reason);
                break;
            case "RESTORE":
                events.emitPostRestored(postId, moderatorId, reason);
                break;
            case "ESCALATE":
                events.emitPostEscalated(postId, moderatorId, reason);
                break;
            case "FLAG":
                // Internal flag - no public event
                break;
        }
    }
}
