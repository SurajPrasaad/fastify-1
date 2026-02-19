import type { FastifyReply, FastifyRequest } from "fastify";
import { NotificationService } from "./notification.service.js";
import { NotificationRepository } from "./notification.repository.js";
import {
    GetNotificationsQuerySchema,
    RegisterDeviceSchema,
} from "./notification.dto.js";

const repo = new NotificationRepository();
const service = new NotificationService(repo);

// Export for use by other modules (interaction, comment, follow)
export { service as notificationService };

/**
 * GET /notifications
 * Paginated list with sender info and type filtering
 */
export async function getNotificationsHandler(
    request: FastifyRequest<{ Querystring: any }>,
    reply: FastifyReply
) {
    const userId = request.user!.sub;
    const { limit, cursor, type } = GetNotificationsQuerySchema.parse(
        request.query
    );

    const notifications = await service.getNotifications(
        userId,
        limit,
        cursor,
        type
    );

    return reply.send({
        data: notifications,
        nextCursor:
            notifications.length === limit
                ? notifications[notifications.length - 1]?.createdAt?.toISOString()
                : null,
    });
}

/**
 * GET /notifications/unread-count
 */
export async function getUnreadCountHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const userId = request.user!.sub;
    const count = await service.getUnreadCount(userId);
    return reply.send({ count });
}

/**
 * POST /notifications/register-device
 */
export async function registerDeviceHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const userId = request.user!.sub;
    const data = RegisterDeviceSchema.parse(request.body);
    await service.registerDevice(userId, data);
    return reply.status(201).send({ message: "Device registered" });
}

/**
 * PATCH /notifications/:id/read
 */
export async function markReadHandler(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    const userId = request.user!.sub;
    const { id } = request.params;
    await service.markRead(id, userId);
    return reply.send({ success: true });
}

/**
 * POST /notifications/read-all
 */
export async function markAllReadHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const userId = request.user!.sub;
    await service.markAllRead(userId);
    return reply.send({ success: true });
}
