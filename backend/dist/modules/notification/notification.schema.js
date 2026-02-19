import { z } from "zod";
export const getNotificationsQuerySchema = z.object({
    limit: z.coerce.number().min(1).max(50).default(20),
    cursor: z.string().datetime().optional(), // createdAt timestamp for pagination
});
export const markReadParamsSchema = z.object({
    id: z.string().uuid(),
});
export const notificationResponseSchema = z.object({
    id: z.string().uuid(),
    recipientId: z.string().uuid(),
    actorId: z.string().uuid(),
    type: z.enum(["LIKE", "COMMENT", "FOLLOW"]),
    entityId: z.string().uuid(),
    isRead: z.boolean(),
    createdAt: z.date(),
    actor: z.object({
        username: z.string(),
        name: z.string(),
    }).optional(),
});
export const getNotificationsRouteSchema = {
    querystring: getNotificationsQuerySchema,
    // response: { 200: z.array(notificationResponseSchema) } // Omitted for flexible paginated response structure
};
export const markReadRouteSchema = {
    params: markReadParamsSchema,
    response: {
        200: z.object({ success: z.boolean() })
    }
};
export const markAllReadRouteSchema = {
    response: {
        200: z.object({ success: z.boolean(), count: z.number() })
    }
};
//# sourceMappingURL=notification.schema.js.map