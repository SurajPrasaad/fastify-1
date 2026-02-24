import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { SettingsController } from "./settings.controller.js";
import { SettingsService } from "./settings.service.js";
import { SettingsRepository } from "./settings.repository.js";
import { chatSettingsSchema, supportTicketSchema } from "./settings.schema.js";
import { requireAuth } from "../../middleware/auth.js";

export async function settingsRoutes(fastify: FastifyInstance) {
    const repository = new SettingsRepository();
    const service = new SettingsService(repository);
    const controller = new SettingsController(service);

    const securedFastify = fastify.withTypeProvider<ZodTypeProvider>().register(async (instance) => {
        instance.addHook("preHandler", requireAuth);

        // Chat Settings
        instance.get("/chat", {
            schema: {
                description: "Get user chat settings",
                tags: ["Settings"],
            }
        }, (req, rep) => controller.getChatSettings(req, rep));

        instance.patch("/chat", {
            schema: {
                body: chatSettingsSchema,
                description: "Update user chat settings",
                tags: ["Settings"],
            }
        }, (req, rep) => controller.updateChatSettings(req as any, rep));

        // Support Tickets
        instance.post("/tickets", {
            schema: {
                body: supportTicketSchema,
                description: "Create a new support ticket",
                tags: ["Settings"],
            }
        }, (req, rep) => controller.createTicket(req as any, rep));

        instance.get("/tickets", {
            schema: {
                description: "Get user support tickets",
                tags: ["Settings"],
            }
        }, (req, rep) => controller.getTickets(req, rep));

        // Data Archives
        instance.post("/data/request", {
            schema: {
                description: "Request data archive export",
                tags: ["Settings"],
            }
        }, (req, rep) => controller.requestDataArchive(req, rep));

        instance.get("/data/requests", {
            schema: {
                description: "Get data archive requests",
                tags: ["Settings"],
            }
        }, (req, rep) => controller.getDataRequests(req, rep));

        // Sessions & Activity
        instance.get("/sessions", {
            schema: {
                description: "Get active sessions",
                tags: ["Settings"],
            }
        }, (req, rep) => controller.getSessions(req, rep));

        instance.get("/logs", {
            schema: {
                description: "Get account audit logs",
                tags: ["Settings"],
            }
        }, (req, rep) => controller.getAuditLogs(req, rep));

        instance.delete("/sessions/:sessionId", {
            schema: {
                description: "Revoke a specific session",
                tags: ["Settings"],
            }
        }, (req, rep) => controller.revokeSession(req as any, rep));

        instance.delete("/sessions/all", {
            schema: {
                description: "Revoke all other sessions",
                tags: ["Settings"],
            }
        }, (req, rep) => controller.revokeAllSessions(req, rep));
    });
}
