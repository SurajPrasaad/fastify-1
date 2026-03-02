/**
 * Moderation Repository — Data Access Layer
 * 
 * Handles all database operations for the moderation workflow:
 * - Queue management (push/pull from moderation queue)
 * - Post status transitions
 * - Moderation log persistence
 * - Report resolution
 */

import { db } from "../../config/drizzle.js";
import {
    moderationReports, moderationQueue, posts, users,
    adminAuditLogsExtended, moderationLogs
} from "../../db/schema.js";
import { and, desc, eq, sql, count, inArray, asc, gte, lte } from "drizzle-orm";
import type { CreateReportInput, ResolveReportInput, ModeratePostInput } from "./moderation.schema.js";
import type { PostStatus } from "../post/post.state-machine.js";

export class ModerationRepository {

    // ─── Report Management ───────────────────────────────

    async createReport(data: CreateReportInput & { reporterId: string }) {
        const [report] = await db
            .insert(moderationReports)
            .values({
                ...data,
                priorityScore: 0,
            })
            .returning();

        if (report) {
            await db.insert(moderationQueue).values({
                reportId: report.id,
                priority: 0,
            });
        }

        return report;
    }

    // ─── Moderation Queue ────────────────────────────────

    /**
     * Get posts pending moderation, ordered by risk_score (descending) + created_at (ascending = FIFO).
     * This is the primary moderation queue query.
     */
    async getPendingPosts(limit: number = 20) {
        try {
            const results = await db
                .select({
                    id: posts.id,
                    content: posts.content,
                    codeSnippet: posts.codeSnippet,
                    language: posts.language,
                    mediaUrls: posts.mediaUrls,
                    status: posts.status,
                    riskScore: posts.riskScore,
                    createdAt: posts.createdAt,
                    author: {
                        id: users.id,
                        username: users.username,
                        name: users.name,
                        avatarUrl: users.avatarUrl,
                    },
                    reportsCount: sql<number>`(SELECT count(*) FROM moderation_reports WHERE post_id = ${posts.id} AND status = 'PENDING')`,
                })
                .from(posts)
                .innerJoin(users, eq(posts.userId, users.id))
                .where(eq(posts.status, "PENDING_REVIEW"))
                .orderBy(desc(posts.riskScore), asc(posts.createdAt))
                .limit(limit);

            return results;
        } catch (error) {
            console.error("MODERATION_QUEUE_ERROR:", error);
            throw error;
        }
    }

    /**
     * Get legacy report-based queue items (for backward compatibility).
     */
    async getReportQueue(limit: number, moderatorId?: string) {
        try {
            const conditions = [eq(moderationReports.status, 'PENDING')];

            const results = await db
                .select({
                    id: moderationQueue.id,
                    reportId: moderationQueue.reportId,
                    assignedToId: moderationQueue.assignedToId,
                    priority: moderationQueue.priority,
                    createdAt: moderationQueue.createdAt,
                    status: moderationReports.status,
                    reason: moderationReports.reason,
                    category: moderationReports.category,
                    content: posts.content,
                    authorName: users.username,
                    thumbnail: posts.mediaUrls,
                    reports: moderationReports.priorityScore,
                })
                .from(moderationQueue)
                .innerJoin(moderationReports, eq(moderationQueue.reportId, moderationReports.id))
                .leftJoin(posts, eq(moderationReports.postId, posts.id))
                .leftJoin(users, eq(posts.userId, users.id))
                .where(and(...conditions))
                .orderBy(desc(moderationQueue.priority), moderationQueue.createdAt)
                .limit(limit);

            return results.map(r => ({
                ...r,
                thumbnail: (r.thumbnail as string[])?.[0] || undefined,
                reports: r.reports || 0,
            }));
        } catch (error) {
            console.error("DB_GET_QUEUE_ERROR:", error);
            throw error;
        }
    }

    // ─── Post Moderation Actions ─────────────────────────

    /**
     * Transition a post to a new status with full audit trail.
     */
    async moderatePost(data: {
        postId: string;
        action: string;
        moderatorId: string;
        newStatus: PostStatus;
        reason: string;
        internalNote?: string | undefined;
    }) {
        return await db.transaction(async (tx) => {
            // 1. Fetch current post state
            const [post] = await tx.select().from(posts).where(eq(posts.id, data.postId)).limit(1);
            if (!post) throw new Error("Post not found");

            const previousStatus = post.status;

            // 2. Update post status
            const updateData: Record<string, unknown> = {
                status: data.newStatus,
                reviewedBy: data.moderatorId,
                reviewedAt: new Date(),
                updatedAt: new Date(),
                moderationMetadata: sql`jsonb_set(
                    jsonb_set(
                        COALESCE(moderation_metadata, '{}'::jsonb),
                        '{lastModeratorId}',
                        to_jsonb(${data.moderatorId}::text)
                    ),
                    '{processedAt}',
                    to_jsonb(${new Date().toISOString()}::text)
                )`,
            };

            // Set publishedAt when approving/publishing
            if (data.newStatus === "PUBLISHED" || data.newStatus === "APPROVED") {
                (updateData as any).publishedAt = new Date();
            }

            // Store rejection reason in metadata
            if (data.newStatus === "REJECTED") {
                updateData.moderationMetadata = sql`jsonb_set(
                    jsonb_set(
                        COALESCE(moderation_metadata, '{}'::jsonb),
                        '{lastModeratorId}',
                        to_jsonb(${data.moderatorId}::text)
                    ),
                    '{rejectionReason}',
                    to_jsonb(${data.reason}::text)
                )`;
            }

            // Store revision notes
            if (data.newStatus === "NEEDS_REVISION") {
                updateData.moderationMetadata = sql`jsonb_set(
                    jsonb_set(
                        COALESCE(moderation_metadata, '{}'::jsonb),
                        '{lastModeratorId}',
                        to_jsonb(${data.moderatorId}::text)
                    ),
                    '{revisionNotes}',
                    to_jsonb(${data.reason}::text)
                )`;
            }

            await tx.update(posts).set(updateData as any).where(eq(posts.id, data.postId));

            // 3. Write moderation log
            await tx.insert(moderationLogs).values({
                postId: data.postId,
                moderatorId: data.moderatorId,
                action: data.action as any,
                previousStatus,
                newStatus: data.newStatus,
                reason: data.reason,
                internalNote: data.internalNote,
            });

            // 4. Resolve any pending reports on this post
            if (["APPROVE", "REJECT", "REMOVE"].includes(data.action)) {
                await tx.update(moderationReports)
                    .set({
                        status: data.action === "APPROVE" ? "DISMISSED" : "RESOLVED",
                        resolution: data.reason,
                        resolvedById: data.moderatorId,
                        updatedAt: new Date(),
                    })
                    .where(
                        and(
                            eq(moderationReports.postId, data.postId),
                            eq(moderationReports.status, "PENDING")
                        )
                    );
            }

            // 5. Write admin audit log
            await tx.insert(adminAuditLogsExtended).values({
                adminId: data.moderatorId,
                actionType: `POST_${data.action}`,
                resourceType: "POST",
                resourceId: data.postId,
                reason: data.reason,
                previousState: { status: previousStatus },
                newState: { status: data.newStatus, internalNote: data.internalNote },
            });

            return {
                success: true,
                postId: data.postId,
                previousStatus,
                newStatus: data.newStatus,
                action: data.action,
            };
        });
    }

    // ─── Moderation Log Queries ──────────────────────────

    /**
     * Get moderation history for a specific post.
     */
    async getPostModerationHistory(postId: string) {
        return db
            .select({
                id: moderationLogs.id,
                action: moderationLogs.action,
                previousStatus: moderationLogs.previousStatus,
                newStatus: moderationLogs.newStatus,
                reason: moderationLogs.reason,
                internalNote: moderationLogs.internalNote,
                createdAt: moderationLogs.createdAt,
                moderator: {
                    id: users.id,
                    username: users.username,
                    name: users.name,
                },
            })
            .from(moderationLogs)
            .innerJoin(users, eq(moderationLogs.moderatorId, users.id))
            .where(eq(moderationLogs.postId, postId))
            .orderBy(desc(moderationLogs.createdAt));
    }

    /**
     * Get moderator productivity metrics.
     */
    async getModeratorMetrics(moderatorId: string, timeRangeHours: number = 24) {
        const since = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);

        const results = await db
            .select({
                action: moderationLogs.action,
                count: count(),
            })
            .from(moderationLogs)
            .where(
                and(
                    eq(moderationLogs.moderatorId, moderatorId),
                    gte(moderationLogs.createdAt, since)
                )
            )
            .groupBy(moderationLogs.action);

        return results;
    }

    /**
     * Get moderation SLA metrics (average time from PENDING_REVIEW to decision).
     */
    async getModerationSlaMetrics(timeRangeHours: number = 24) {
        const since = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);

        const result = await db.execute(sql`
            SELECT 
                COUNT(*) as total_moderated,
                AVG(EXTRACT(EPOCH FROM (${posts.reviewedAt} - ${posts.createdAt}))) as avg_review_seconds,
                PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (${posts.reviewedAt} - ${posts.createdAt}))) as p50_seconds,
                PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (${posts.reviewedAt} - ${posts.createdAt}))) as p95_seconds,
                PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (${posts.reviewedAt} - ${posts.createdAt}))) as p99_seconds
            FROM posts
            WHERE reviewed_at IS NOT NULL
            AND reviewed_at >= ${since}
        `);

        return result.rows[0];
    }

    // ─── Report Resolution ───────────────────────────────

    async resolveReport(data: ResolveReportInput & { resolvedById: string }, auditLog: Record<string, unknown>) {
        return await db.transaction(async (tx) => {
            const [report] = await tx
                .update(moderationReports)
                .set({
                    status: 'RESOLVED',
                    resolution: data.resolution,
                    resolvedById: data.resolvedById,
                    updatedAt: new Date(),
                })
                .where(eq(moderationReports.id, data.reportId))
                .returning();

            if (!report) throw new Error("Report not found");

            // Perform action on target if needed
            if (data.action !== 'APPROVE' as any) {
                if (report.postId) {
                    const statusMap: Record<string, string> = {
                        'REJECT': 'REJECTED',
                        'SOFT_DELETE': 'REMOVED',
                        'HARD_DELETE': 'REMOVED',
                        'SHADOW_BAN': 'RESTRICTED',
                        'RESTORE': 'PUBLISHED'
                    };
                    await tx.update(posts)
                        .set({ status: (statusMap[data.action] || 'PUBLISHED') as any })
                        .where(eq(posts.id, report.postId));
                }
            }

            // Remove from queue
            await tx.delete(moderationQueue).where(eq(moderationQueue.reportId, data.reportId));

            // Audit log
            await tx.insert(adminAuditLogsExtended).values({
                adminId: data.resolvedById,
                actionType: data.action,
                resourceType: report.postId ? 'POST' : (report.commentId ? 'COMMENT' : 'USER'),
                resourceId: (report.postId || report.commentId || report.targetUserId)!,
                reason: data.resolution,
                previousState: auditLog.previousState as any,
                newState: auditLog.newState as any,
                ipAddress: auditLog.ipAddress as string,
                userAgent: auditLog.userAgent as string,
            });

            return report;
        });
    }

    // ─── Queue Assignment ────────────────────────────────

    async assignToModerator(queueId: string, moderatorId: string) {
        return await db
            .update(moderationQueue)
            .set({
                assignedToId: moderatorId,
                lockedUntil: new Date(Date.now() + 15 * 60 * 1000)
            })
            .where(eq(moderationQueue.id, queueId))
            .returning();
    }

    // ─── Queue Statistics ────────────────────────────────

    async getQueueStats() {
        const [pendingCount, approvedToday, rejectedToday] = await Promise.all([
            db.select({ count: count() }).from(posts).where(eq(posts.status, "PENDING_REVIEW")),
            db.select({ count: count() }).from(moderationLogs).where(
                and(
                    eq(moderationLogs.action, "APPROVE"),
                    gte(moderationLogs.createdAt, new Date(new Date().setHours(0, 0, 0, 0)))
                )
            ),
            db.select({ count: count() }).from(moderationLogs).where(
                and(
                    eq(moderationLogs.action, "REJECT"),
                    gte(moderationLogs.createdAt, new Date(new Date().setHours(0, 0, 0, 0)))
                )
            ),
        ]);

        return {
            pendingCount: pendingCount[0]?.count || 0,
            approvedToday: approvedToday[0]?.count || 0,
            rejectedToday: rejectedToday[0]?.count || 0,
        };
    }
}
