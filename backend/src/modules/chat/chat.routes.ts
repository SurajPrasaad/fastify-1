
import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/auth.js";
import {
    createRoomHandler,
    getConversationsHandler,
    getHistoryHandler,
    getPresenceHandler,
    searchMessagesHandler,
    sendMessageHandler
} from "./chat.controller.js";
export async function chatRoutes(app: FastifyInstance) {
    // REST APIs
    app.register(async (protectedApp) => {
        protectedApp.addHook("preHandler", requireAuth);

        protectedApp.post("/rooms", createRoomHandler);
        protectedApp.get("/rooms", getConversationsHandler);
        protectedApp.post("/rooms/:roomId/messages", sendMessageHandler);
        protectedApp.get("/rooms/:roomId/messages", getHistoryHandler);
        protectedApp.get("/messages/search", searchMessagesHandler);
        protectedApp.get("/presence/:userId", getPresenceHandler);
    });
}
