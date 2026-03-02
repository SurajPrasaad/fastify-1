/**
 * Moderation Controller — HTTP Request Handlers
 * 
 * Handles REST API requests for the moderation workflow.
 * All privileged endpoints are protected by RBAC middleware.
 */

import type { FastifyReply, FastifyRequest } from "fastify";
import { ModerationService } from "./moderation.service.js";
import type { CreateReportInput, ResolveReportInput, ModeratePostInput } from "./moderation.schema.js";
import type { UserRole } from "../../middleware/rbac.js";

export class ModerationController {
    private service = new ModerationService();

    // ─── User Endpoints ──────────────────────────────────

    async createReport(
        request: FastifyRequest<{ Body: CreateReportInput }>,
        reply: FastifyReply
    ) {
        const user = request.user as { sub: string; id?: string };
        const report = await this.service.createReport({
            ...request.body,
            reporterId: user.sub || user.id!,
        });
        return reply.status(201).send(report);
    }

    // ─── Moderator Endpoints ─────────────────────────────

    async getModerationQueue(
        request: FastifyRequest<{ Querystring: { limit?: number } }>,
        reply: FastifyReply
    ) {
        const queue = await this.service.getModerationQueue(request.query.limit || 20);
        return reply.send(queue);
    }

    async moderatePost(
        request: FastifyRequest<{ Body: ModeratePostInput }>,
        reply: FastifyReply
    ) {
        const user = request.user as { sub: string; id?: string; role?: string };
        const result = await this.service.moderatePost(
            {
                ...request.body,
                moderatorId: user.sub || user.id!,
            },
            (user.role || "USER") as UserRole,
            false,
            {
                ipAddress: request.ip,
                userAgent: request.headers['user-agent'] as string,
            }
        );
        return reply.send(result);
    }

    async lockPost(
        request: FastifyRequest<{ Params: { postId: string } }>,
        reply: FastifyReply
    ) {
        const user = request.user as { sub: string; id?: string };
        const result = await this.service.lockPost(
            request.params.postId,
            user.sub || user.id!
        );
        return reply.send(result);
    }

    async unlockPost(
        request: FastifyRequest<{ Params: { postId: string } }>,
        reply: FastifyReply
    ) {
        const user = request.user as { sub: string; id?: string };
        const result = await this.service.unlockPost(
            request.params.postId,
            user.sub || user.id!
        );
        return reply.send({ released: result });
    }

    async getPostHistory(
        request: FastifyRequest<{ Params: { postId: string } }>,
        reply: FastifyReply
    ) {
        const history = await this.service.getPostModerationHistory(
            request.params.postId
        );
        return reply.send(history);
    }

    async getQueueStats(
        request: FastifyRequest,
        reply: FastifyReply
    ) {
        const stats = await this.service.getQueueStats();
        return reply.send(stats);
    }

    // ─── Legacy Endpoints ────────────────────────────────

    async getQueue(
        request: FastifyRequest<{ Querystring: { limit?: number } }>,
        reply: FastifyReply
    ) {
        const user = request.user as { sub: string; id?: string };
        const queue = await this.service.getReportQueue(
            request.query.limit || 20,
            user.sub || user.id
        );
        return reply.send(queue);
    }

    async resolveReport(
        request: FastifyRequest<{ Body: ResolveReportInput }>,
        reply: FastifyReply
    ) {
        const user = request.user as { sub: string; id?: string };
        const result = await this.service.resolveReport(
            { ...request.body, resolvedById: user.sub || user.id! },
            {
                ipAddress: request.ip,
                userAgent: request.headers['user-agent'] as string,
            }
        );
        return reply.send(result);
    }

    async assignTask(
        request: FastifyRequest<{ Params: { queueId: string } }>,
        reply: FastifyReply
    ) {
        const user = request.user as { sub: string; id?: string };
        const result = await this.service.assignTask(
            request.params.queueId,
            user.sub || user.id!
        );
        return reply.send(result);
    }
}
