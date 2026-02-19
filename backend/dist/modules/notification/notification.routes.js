import { requireAuth } from "../../middleware/auth.js";
import { getNotificationsHandler, registerDeviceHandler, markReadHandler, markAllReadHandler } from "./notification.controller.js";
import { RegisterDeviceSchema, GetNotificationsQuerySchema } from "./notification.dto.js";
export async function notificationRoutes(fastify) {
    fastify.addHook("preHandler", requireAuth);
    fastify.get("/", {
        schema: {
            querystring: GetNotificationsQuerySchema
        },
        handler: getNotificationsHandler
    });
    fastify.post("/register-device", {
        schema: {
            body: RegisterDeviceSchema
        },
        handler: registerDeviceHandler
    });
    fastify.patch("/:id/read", {
        handler: markReadHandler
    });
    fastify.post("/read-all", {
        handler: markAllReadHandler
    });
}
//# sourceMappingURL=notification.routes.js.map