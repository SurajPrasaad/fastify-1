import { NotificationService } from "./notification.service.js";
import { NotificationRepository } from "./notification.repository.js";
import { GetNotificationsQuerySchema, RegisterDeviceSchema, UpdatePreferencesSchema } from "./notification.dto.js";
const repo = new NotificationRepository();
const service = new NotificationService(repo);
/**
 * Enterprise Notification Controller
 * Handles user preferences, device registration, and notification history.
 */
export async function getNotificationsHandler(request, reply) {
    const userId = request.user.sub;
    const { limit, cursor } = GetNotificationsQuerySchema.parse(request.query);
    const notifications = await service.getNotifications(userId, limit, cursor);
    return reply.send(notifications);
}
export async function registerDeviceHandler(request, reply) {
    const userId = request.user.sub;
    const data = RegisterDeviceSchema.parse(request.body);
    await service.registerDevice(userId, data);
    return reply.status(201).send({ message: "Device registered" });
}
export async function markReadHandler(request, reply) {
    const userId = request.user.sub;
    const { id } = request.params;
    await service.markRead(id, userId);
    return reply.send({ success: true });
}
export async function markAllReadHandler(request, reply) {
    const userId = request.user.sub;
    await repo.markAllAsRead(userId);
    return reply.send({ success: true });
}
/**
 * Principal-level API for internal use or admin dashboard
 * Allows defining new templates on the fly
 */
export async function createTemplateHandler(request, reply) {
    // Shared secret or Internal Auth check
    const template = await repo.getTemplateBySlug(request.body.slug);
    if (template)
        return reply.status(409).send({ message: "Template exists" });
    // Implementation of template creation...
    return reply.status(501).send({ message: "Not implemented" });
}
//# sourceMappingURL=notification.controller.js.map