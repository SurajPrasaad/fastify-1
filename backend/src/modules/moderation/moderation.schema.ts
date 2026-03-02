import { z } from "zod";

// ─── Post Status Enum ────────────────────────────────────

export const postStatusEnum = z.enum([
    "DRAFT",
    "PENDING_REVIEW",
    "APPROVED",
    "PUBLISHED",
    "REJECTED",
    "NEEDS_REVISION",
    "REMOVED",
    "ARCHIVED",
]);

// ─── Report Schemas ──────────────────────────────────────

export const reportCategoryEnum = z.enum([
    "SPAM", "HARASSMENT", "HATE_SPEECH", "INAPPROPRIATE", "CHILD_SAFETY", "OTHER"
]);

export const reportStatusEnum = z.enum(["PENDING", "RESOLVED", "DISMISSED"]);

export const createReportSchema = z.object({
    postId: z.string().uuid().optional(),
    commentId: z.string().uuid().optional(),
    targetUserId: z.string().uuid().optional(),
    reason: z.string().min(1).max(1000),
    category: reportCategoryEnum,
}).refine(data => data.postId || data.commentId || data.targetUserId, {
    message: "Must report a post, comment, or user",
    path: ["reason"]
});

// ─── Moderation Action Schemas ───────────────────────────

export const moderationActionEnum = z.enum([
    "APPROVE", "REJECT", "REQUEST_REVISION", "REMOVE", "RESTORE", "ESCALATE"
]);

export const moderatePostSchema = z.object({
    postId: z.string().uuid(),
    action: moderationActionEnum,
    reason: z.string().min(1).max(2000),
    internalNote: z.string().max(5000).optional(),
});

export const resolveReportSchema = z.object({
    reportId: z.string().uuid(),
    resolution: z.string().min(1),
    action: z.enum(["APPROVE", "REJECT", "SOFT_DELETE", "HARD_DELETE", "SHADOW_BAN", "RESTORE"]),
});

// ─── Queue Query Schemas ─────────────────────────────────

export const queueQuerySchema = z.object({
    limit: z.number().min(1).max(100).default(20),
    category: z.string().optional(),
    riskLevel: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).optional(),
});

export const lockPostSchema = z.object({
    postId: z.string().uuid(),
});

export const moderationQueueSchema = z.object({
    id: z.string().uuid(),
    reportId: z.string().uuid(),
    assignedToId: z.string().uuid().nullable(),
    priority: z.number(),
    createdAt: z.date(),
    report: z.object({
        reason: z.string(),
        category: reportCategoryEnum,
        post: z.any().optional(),
        comment: z.any().optional(),
    })
});

// ─── Exported Types ──────────────────────────────────────

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type ResolveReportInput = z.infer<typeof resolveReportSchema>;
export type ModeratePostInput = z.infer<typeof moderatePostSchema>;
export type QueueQueryInput = z.infer<typeof queueQuerySchema>;
