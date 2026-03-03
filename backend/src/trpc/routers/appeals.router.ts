/**
 * Appeals tRPC Router
 */

import { z } from "zod";
import { router, protectedProcedure, moderatorProcedure } from "../trpc.js";
import { AppealsService } from "../../modules/appeals/appeals.service.js";
import { createAppealSchema, reviewAppealSchema } from "../../modules/appeals/appeals.schema.js";

const service = new AppealsService();

export const appealsRouter = router({
    create: protectedProcedure
        .input(createAppealSchema)
        .mutation(({ ctx, input }) => {
            const reqCtx: { ipAddress?: string; userAgent?: string } = {};
            if (ctx.req.ip) reqCtx.ipAddress = ctx.req.ip;
            const ua = ctx.req.headers["user-agent"];
            if (typeof ua === "string") reqCtx.userAgent = ua;
            return service.create({ ...input, userId: ctx.user.id }, reqCtx);
        }),

    list: moderatorProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).optional().default(20),
                offset: z.number().min(0).optional().default(0),
                status: z.enum(["PENDING", "APPROVED", "REJECTED", "MODIFIED"]).optional(),
                userId: z.string().uuid().optional(),
                resourceType: z.enum(["POST", "USER", "COMMENT"]).optional(),
                enforcementType: z.enum([
                    "CONTENT_REMOVAL",
                    "TEMPORARY_SUSPENSION",
                    "PERMANENT_BAN",
                    "ACCOUNT_RESTRICTION",
                    "OVERRIDE_DECISION",
                ]).optional(),
            })
        )
        .query(({ input }) => {
            const params: Parameters<typeof service.list>[0] = { limit: input.limit, offset: input.offset };
            if (input.status !== undefined) params.status = input.status;
            if (input.userId !== undefined) params.userId = input.userId;
            if (input.resourceType !== undefined) params.resourceType = input.resourceType;
            if (input.enforcementType !== undefined) params.enforcementType = input.enforcementType;
            return service.list(params);
        }),

    getById: moderatorProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(({ input }) => service.getById(input.id)),

    getPendingCount: moderatorProcedure.query(() => service.getPendingCount()),

    review: moderatorProcedure
        .input(reviewAppealSchema)
        .mutation(({ ctx, input }) => {
            const reqCtx: { ipAddress?: string; userAgent?: string } = {};
            if (ctx.req.ip) reqCtx.ipAddress = ctx.req.ip;
            const ua = ctx.req.headers["user-agent"];
            if (typeof ua === "string") reqCtx.userAgent = ua;
            return service.review({ ...input, reviewerId: ctx.user.id }, reqCtx);
        }),
});
