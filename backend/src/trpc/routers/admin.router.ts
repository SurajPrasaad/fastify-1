/**
 * Admin tRPC Router — ADMIN-only Operations
 * 
 * All routes use adminProcedure (ADMIN + SUPER_ADMIN only).
 * Includes: override decisions, suspend users, assign roles,
 * audit logs, analytics, system configuration.
 */

import { router, adminProcedure } from "../trpc.js";
import { z } from "zod";
import { AdminService } from "../../modules/admin/admin.service.js";
import { AuditService } from "../../modules/audit/audit.service.js";

const service = new AdminService();
const auditService = new AuditService();

export const adminRouter = router({

    // ─── Post Management ─────────────────────────────────

    posts: router({
        list: adminProcedure
            .input(z.object({
                limit: z.number().default(50),
                offset: z.number().default(0),
                search: z.string().optional(),
                status: z.array(z.string()).optional(),
                category: z.string().optional(),
                riskLevel: z.enum(['CRITICAL', 'ELEVATED', 'LOW']).optional(),
                sortField: z.string().optional(),
                sortOrder: z.enum(['asc', 'desc']).optional()
            }))
            .query(async ({ input }) => {
                return await service.listPosts(input);
            }),

        getById: adminProcedure
            .input(z.object({ id: z.string() }))
            .query(async ({ input }) => {
                return await service.getPostDetail(input.id);
            }),

        getNextInQueue: adminProcedure
            .input(z.object({ currentId: z.string(), filters: z.any() }))
            .query(async ({ input }) => {
                return await service.getNextPost(input.currentId, input.filters);
            }),

        // Admin override: can change any post status regardless of state machine
        moderate: adminProcedure
            .input(z.object({
                postId: z.string(),
                action: z.enum(['APPROVE', 'REJECT', 'NEEDS_REVISION', 'DELETE', 'SHADOW_BAN', 'RESTORE', 'ESCALATE']),
                reason: z.string(),
                internalNote: z.string().optional()
            }))
            .mutation(async ({ input, ctx }) => {
                return await service.moderate({ ...input, adminId: ctx.user.id });
            }),

        bulkModerate: adminProcedure
            .input(z.object({
                postIds: z.array(z.string()),
                action: z.enum(['APPROVE', 'DELETE', 'RESTORE']),
                reason: z.string()
            }))
            .mutation(async ({ input, ctx }) => {
                return await service.bulkPostAction(input.postIds, input.action, ctx.user.id, input.reason);
            }),

        addNote: adminProcedure
            .input(z.object({ postId: z.string(), content: z.string() }))
            .mutation(async ({ input, ctx }) => {
                return await service.addNote(input.postId, ctx.user.id, input.content);
            }),

        getReports: adminProcedure
            .input(z.object({ postId: z.string() }))
            .query(async ({ input }) => {
                return await service.getReports(input.postId);
            }),
    }),

    // ─── User Management (Admin Only) ────────────────────

    users: router({
        suspend: adminProcedure
            .input(z.object({
                userId: z.string().uuid(),
                reason: z.string().min(1),
            }))
            .mutation(async ({ input, ctx }) => {
                return await service.suspendUser(input.userId, ctx.user.id, input.reason);
            }),

        unsuspend: adminProcedure
            .input(z.object({
                userId: z.string().uuid(),
                reason: z.string().min(1),
            }))
            .mutation(async ({ input, ctx }) => {
                return await service.unsuspendUser(input.userId, ctx.user.id, input.reason);
            }),

        assignRole: adminProcedure
            .input(z.object({
                userId: z.string().uuid(),
                role: z.enum(["USER", "MODERATOR", "ADMIN"]),
                reason: z.string().min(1),
            }))
            .mutation(async ({ input, ctx }) => {
                return await service.assignRole(input.userId, input.role, ctx.user.id, input.reason);
            }),
    }),

    // ─── Audit Logs ──────────────────────────────────────

    auditLogs: router({
        query: adminProcedure
            .input(z.object({
                limit: z.number().optional().default(50),
                offset: z.number().optional().default(0),
                actorId: z.string().uuid().optional(),
                actionType: z.string().optional(),
                resourceType: z.string().optional(),
                resourceId: z.string().optional(),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
                search: z.string().optional(),
            }))
            .query(async ({ input }) => {
                return await auditService.queryLogs(input);
            }),

        getEntityHistory: adminProcedure
            .input(z.object({
                resourceType: z.string(),
                resourceId: z.string(),
            }))
            .query(async ({ input }) => {
                return await auditService.getEntityHistory(input.resourceType, input.resourceId);
            }),

        getAdminActivity: adminProcedure
            .input(z.object({
                timeRangeHours: z.number().min(1).max(720).optional().default(24),
            }))
            .query(async ({ input }) => {
                return await auditService.getAdminActivity(input.timeRangeHours);
            }),

        getActionDistribution: adminProcedure
            .input(z.object({
                timeRangeHours: z.number().min(1).max(720).optional().default(24),
            }))
            .query(async ({ input }) => {
                return await auditService.getActionDistribution(input.timeRangeHours);
            }),
    }),

    // ─── Dashboard Analytics ─────────────────────────────

    getStats: adminProcedure
        .query(async () => {
            return await service.getDashboardStats();
        }),
});
