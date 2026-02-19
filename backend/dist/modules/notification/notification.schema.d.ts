import { z } from "zod";
import type { FastifySchema } from "fastify";
export declare const getNotificationsQuerySchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    cursor: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const markReadParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const notificationResponseSchema: z.ZodObject<{
    id: z.ZodString;
    recipientId: z.ZodString;
    actorId: z.ZodString;
    type: z.ZodEnum<{
        COMMENT: "COMMENT";
        FOLLOW: "FOLLOW";
        LIKE: "LIKE";
    }>;
    entityId: z.ZodString;
    isRead: z.ZodBoolean;
    createdAt: z.ZodDate;
    actor: z.ZodOptional<z.ZodObject<{
        username: z.ZodString;
        name: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const getNotificationsRouteSchema: FastifySchema;
export declare const markReadRouteSchema: FastifySchema;
export declare const markAllReadRouteSchema: FastifySchema;
//# sourceMappingURL=notification.schema.d.ts.map