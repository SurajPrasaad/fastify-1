import type { FastifyReply, FastifyRequest } from "fastify";
import type { SettingsService } from "./settings.service.js";
import type {
    UpdateChatSettingsDto,
    CreateSupportTicketDto
} from "./settings.dto.js";

export class SettingsController {
    constructor(private settingsService: SettingsService) { }

    async getChatSettings(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user!.sub;
        const settings = await this.settingsService.getChatSettings(userId);
        return reply.send(settings);
    }

    async updateChatSettings(request: FastifyRequest<{ Body: UpdateChatSettingsDto }>, reply: FastifyReply) {
        const userId = request.user!.sub;
        const settings = await this.settingsService.updateChatSettings(userId, request.body, request.ip);
        return reply.send(settings);
    }

    async createTicket(request: FastifyRequest<{ Body: CreateSupportTicketDto }>, reply: FastifyReply) {
        const userId = request.user!.sub;
        const ticket = await this.settingsService.createTicket(userId, request.body);
        return reply.status(201).send(ticket);
    }

    async getTickets(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user!.sub;
        const tickets = await this.settingsService.getTickets(userId);
        return reply.send(tickets);
    }

    async requestDataArchive(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user!.sub;
        const dataRequest = await this.settingsService.requestDataArchive(userId);
        return reply.status(202).send(dataRequest);
    }

    async getDataRequests(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user!.sub;
        const requests = await this.settingsService.getDataRequests(userId);
        return reply.send(requests);
    }

    async getSessions(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user!.sub;
        const sessions = await this.settingsService.getSessions(userId);
        return reply.send(sessions);
    }

    async getAuditLogs(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user!.sub;
        const logs = await this.settingsService.getAuditLogs(userId);
        return reply.send(logs);
    }

    async revokeSession(request: FastifyRequest<{ Params: { sessionId: string } }>, reply: FastifyReply) {
        const userId = request.user!.sub;
        await this.settingsService.revokeSession(userId, request.params.sessionId);
        return reply.status(204).send();
    }

    async revokeAllSessions(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user!.sub;
        await this.settingsService.revokeAllSessions(userId);
        return reply.status(204).send();
    }
}
