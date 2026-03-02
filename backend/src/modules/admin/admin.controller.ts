import type { FastifyReply, FastifyRequest } from "fastify";
import { AdminService } from "./admin.service.js";

export class AdminController {
    private service = new AdminService();

    async getAuditLogs(request: FastifyRequest<{ Querystring: { limit?: number; cursor?: string } }>, reply: FastifyReply) {
        const logs = await this.service.getHistory(request.query.limit, request.query.cursor);
        return reply.send(logs);
    }

    async bulkAction(request: FastifyRequest<{ Body: { postIds: string[]; action: any; reason: string } }>, reply: FastifyReply) {
        const user = request.user as any;
        const result = await this.service.bulkPostAction(
            request.body.postIds,
            request.body.action,
            user.id,
            request.body.reason
        );
        return reply.send(result);
    }

    async getStats(request: FastifyRequest, reply: FastifyReply) {
        const stats = await this.service.getDashboardStats();
        return reply.send(stats);
    }
}
