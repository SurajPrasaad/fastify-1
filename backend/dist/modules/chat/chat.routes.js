import { requireAuth } from "../../middleware/auth.js";
import { createRoomHandler, getConversationsHandler, getHistoryHandler, getPresenceHandler } from "./chat.controller.js";
import { chatGateway } from "./chat.gateway.js";
export async function chatRoutes(app) {
    // WebSocket Gateway (Protected via internally in gateway using req.user)
    app.register(chatGateway);
    // REST APIs
    app.register(async (protectedApp) => {
        protectedApp.addHook("preHandler", requireAuth);
        protectedApp.post("/rooms", createRoomHandler);
        protectedApp.get("/rooms", getConversationsHandler);
        protectedApp.get("/rooms/:roomId/messages", getHistoryHandler);
        protectedApp.get("/presence/:userId", getPresenceHandler);
    });
}
//# sourceMappingURL=chat.routes.js.map