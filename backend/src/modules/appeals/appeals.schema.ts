/**
 * Appeals — Zod validation schemas
 */

import { z } from "zod";

export const createAppealSchema = z.object({
    resourceType: z.enum(["POST", "USER", "COMMENT"]),
    resourceId: z.string().uuid(),
    enforcementType: z.enum([
        "CONTENT_REMOVAL",
        "TEMPORARY_SUSPENSION",
        "PERMANENT_BAN",
        "ACCOUNT_RESTRICTION",
        "OVERRIDE_DECISION",
    ]),
    originalModerationLogId: z.string().uuid().optional(),
    userMessage: z.string().min(1).max(5000),
    evidenceUrls: z.array(z.string().url()).max(10).optional().default([]),
});

export const reviewAppealSchema = z.object({
    appealId: z.string().uuid(),
    decision: z.enum(["APPROVED", "REJECTED", "MODIFIED"]),
    justification: z.string().min(1).max(2000),
    policyReference: z.string().max(200).optional(),
    internalNote: z.string().max(2000).optional(),
});

export type CreateAppealInput = z.infer<typeof createAppealSchema>;
export type ReviewAppealInput = z.infer<typeof reviewAppealSchema>;
