/**
 * Moderation tRPC Router — Pre-Moderation Workflow
 * 
 * Route protection:
 * - createReport: protectedProcedure (any authenticated user)
 * - queue/moderate/lock: moderatorProcedure (MODERATOR + ADMIN)
 * - override/metrics/sla: adminProcedure (ADMIN only)
 */

import { router, protectedProcedure, moderatorProcedure, adminProcedure } from "../trpc.js";
import { z } from "zod";
import { createReportSchema, moderatePostSchema } from "../../modules/moderation/moderation.schema.js";
import { ModerationService } from "../../modules/moderation/moderation.service.js";
import type { UserRole } from "../../middleware/rbac.js";

const service = new ModerationService();

export const moderationRouter = router({

    // ─── User Routes ─────────────────────────────────────

    createReport: protectedProcedure
        .input(createReportSchema)
        .mutation(async ({ input, ctx }) => {
            return await service.createReport({ ...input, reporterId: ctx.user.id });
        }),

    // ─── Moderator Routes ────────────────────────────────

    // Pre-moderation queue (posts pending review)
    getQueue: moderatorProcedure
        .input(z.object({ limit: z.number().min(1).max(100).optional().default(20) }))
        .query(async ({ input }) => {
            return await service.getModerationQueue(input.limit);
        }),

    // Moderate a post (state machine validated)
    moderate: moderatorProcedure
        .input(moderatePostSchema)
        .mutation(async ({ input, ctx }) => {
            return await service.moderatePost(
                { ...input, moderatorId: ctx.user.id },
                (ctx.user.role || "MODERATOR") as UserRole,
                false,
                {
                    ipAddress: ctx.req.ip,
                    userAgent: ctx.req.headers['user-agent'] as string,
                }
            );
        }),

    // Lock a post for exclusive review
    lockPost: moderatorProcedure
        .input(z.object({ postId: z.string().uuid() }))
        .mutation(async ({ input, ctx }) => {
            return await service.lockPost(input.postId, ctx.user.id);
        }),

    // Release a post lock
    unlockPost: moderatorProcedure
        .input(z.object({ postId: z.string().uuid() }))
        .mutation(async ({ input, ctx }) => {
            return await service.unlockPost(input.postId, ctx.user.id);
        }),

    // Get lock info for a post
    getLockInfo: moderatorProcedure
        .input(z.object({ postId: z.string().uuid() }))
        .query(async ({ input }) => {
            return await service.getPostLock(input.postId);
        }),

    // Get moderation history for a specific post
    getPostHistory: moderatorProcedure
        .input(z.object({ postId: z.string().uuid() }))
        .query(async ({ input }) => {
            return await service.getPostModerationHistory(input.postId);
        }),

    // Queue statistics
    getQueueStats: moderatorProcedure
        .query(async () => {
            return await service.getQueueStats();
        }),

    // Queue depth by priority (for monitoring dashboard)
    getQueueDepth: moderatorProcedure
        .query(async () => {
            return await service.getQueueDepthByPriority();
        }),

    // ─── Admin-Only Routes ───────────────────────────────

    // Force-release a lock (admin override)
    forceUnlock: adminProcedure
        .input(z.object({ postId: z.string().uuid() }))
        .mutation(async ({ input, ctx }) => {
            return await service.forceUnlockPost(input.postId, ctx.user.id);
        }),

    // Get all active review locks
    getActiveLocks: adminProcedure
        .query(async () => {
            return await service.getActiveReviewLocks();
        }),

    // Get moderator productivity metrics
    getModeratorMetrics: adminProcedure
        .input(z.object({
            moderatorId: z.string().uuid(),
            timeRangeHours: z.number().min(1).max(720).optional().default(24),
        }))
        .query(async ({ input }) => {
            return await service.getModeratorMetrics(input.moderatorId, input.timeRangeHours);
        }),

    // Get moderation SLA metrics
    getSlaMetrics: adminProcedure
        .input(z.object({
            timeRangeHours: z.number().min(1).max(720).optional().default(24),
        }))
        .query(async ({ input }) => {
            return await service.getModerationSla(input.timeRangeHours);
        }),

    // ─── Legacy Routes (backward compatibility) ──────────

    getReportQueue: moderatorProcedure
        .input(z.object({ limit: z.number().optional() }))
        .query(async ({ input, ctx }) => {
            return await service.getReportQueue(input.limit || 20, ctx.user.id);
        }),

    assignTask: moderatorProcedure
        .input(z.object({ queueId: z.string() }))
        .mutation(async ({ input, ctx }) => {
            return await service.assignTask(input.queueId, ctx.user.id);
        }),
});
