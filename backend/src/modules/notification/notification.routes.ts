import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/auth.js";
import {
    getNotificationsHandler,
    getUnreadCountHandler,
    registerDeviceHandler,
    markReadHandler,
    markAllReadHandler,
} from "./notification.controller.js";
import {
    RegisterDeviceSchema,
    GetNotificationsQuerySchema,
} from "./notification.dto.js";
export async function notificationRoutes(fastify: FastifyInstance) {
    fastify.addHook("preHandler", requireAuth);

    // ─── REST Endpoints ─────────────────────────────────────────────────────

    /**
     * GET /notifications
     * Paginated notification feed with sender info
     * Query: ?limit=20&cursor=<ISO>&type=LIKE|COMMENT|REPLY|MENTION|FOLLOW
     */
    fastify.get("/", {
        schema: {
            querystring: GetNotificationsQuerySchema,
        },
        handler: getNotificationsHandler,
    });

    /**
     * GET /notifications/unread-count
     * Returns { count: number }
     */
    fastify.get("/unread-count", {
        handler: getUnreadCountHandler,
    });

    /**
     * POST /notifications/register-device
     * Register FCM device token
     */
    fastify.post("/register-device", {
        schema: {
            body: RegisterDeviceSchema,
        },
        handler: registerDeviceHandler,
    });

    /**
     * PATCH /notifications/:id/read
     * Mark a single notification as read
     */
    fastify.patch("/:id/read", {
        handler: markReadHandler,
    });

    /**
     * POST /notifications/read-all
     * Mark all unread notifications as read
     */
    fastify.post("/read-all", {
        handler: markAllReadHandler,
    });

}
