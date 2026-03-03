/**
 * Appeals Controller — REST HTTP handlers
 */

import type { FastifyRequest, FastifyReply } from "fastify";
import type { EnforcementType } from "./appeals.repository.js";
import { AppealsService } from "./appeals.service.js";
import { createAppealSchema, reviewAppealSchema } from "./appeals.schema.js";

const service = new AppealsService();

function getUserId(req: FastifyRequest): string {
    const user = (req as any).user;
    if (!user?.id) throw new Error("Unauthorized");
    return user.id;
}

function getRequestContext(req: FastifyRequest): { ipAddress?: string; userAgent?: string } {
    const ctx: { ipAddress?: string; userAgent?: string } = {};
    if (req.ip) ctx.ipAddress = req.ip;
    const ua = req.headers["user-agent"];
    if (typeof ua === "string") ctx.userAgent = ua;
    return ctx;
}

export async function createAppeal(req: FastifyRequest<{ Body: unknown }>, reply: FastifyReply) {
    const body = createAppealSchema.parse(req.body);
    const userId = getUserId(req);
    const appeal = await service.create({ ...body, userId }, getRequestContext(req));
    return reply.status(201).send(appeal);
}

export async function getAppealById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const appeal = await service.getById(req.params.id);
    return reply.send(appeal);
}

const APPEAL_STATUSES = ["PENDING", "APPROVED", "REJECTED", "MODIFIED"] as const;
type AppealStatus = (typeof APPEAL_STATUSES)[number];

export async function listAppeals(req: FastifyRequest<{ Querystring: Record<string, string> }>, reply: FastifyReply) {
    const { limit, offset, status, userId, resourceType, enforcementType } = req.query;
    const params: Parameters<typeof service.list>[0] = {};
    if (limit !== undefined && limit !== "") params.limit = parseInt(limit, 10);
    if (offset !== undefined && offset !== "") params.offset = parseInt(offset, 10);
    if (status !== undefined && APPEAL_STATUSES.includes(status as AppealStatus)) params.status = status as AppealStatus;
    if (userId !== undefined) params.userId = userId;
    if (resourceType !== undefined) params.resourceType = resourceType as "POST" | "USER" | "COMMENT";
    if (enforcementType !== undefined && enforcementType !== "") {
        const enforcement = enforcementType as EnforcementType;
        params.enforcementType = enforcement;
    }
    const result = await service.list(params);
    return reply.send(result);
}

export async function reviewAppeal(req: FastifyRequest<{ Body: unknown }>, reply: FastifyReply) {
    const body = reviewAppealSchema.parse(req.body);
    const reviewerId = getUserId(req);
    const updated = await service.review({ ...body, reviewerId }, getRequestContext(req));
    return reply.send(updated);
}

export async function getPendingCount(_req: FastifyRequest, reply: FastifyReply) {
    const count = await service.getPendingCount();
    return reply.send({ count });
}
