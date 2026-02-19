import type { FastifyReply, FastifyRequest } from "fastify";
/**
 * Enterprise Notification Controller
 * Handles user preferences, device registration, and notification history.
 */
export declare function getNotificationsHandler(request: FastifyRequest<{
    Querystring: any;
}>, reply: FastifyReply): Promise<never>;
export declare function registerDeviceHandler(request: FastifyRequest, reply: FastifyReply): Promise<never>;
export declare function markReadHandler(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function markAllReadHandler(request: FastifyRequest, reply: FastifyReply): Promise<never>;
/**
 * Principal-level API for internal use or admin dashboard
 * Allows defining new templates on the fly
 */
export declare function createTemplateHandler(request: FastifyRequest, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=notification.controller.d.ts.map