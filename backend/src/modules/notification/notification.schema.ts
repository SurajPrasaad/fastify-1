import { z } from "zod";
import type { FastifySchema } from "fastify";

// ─── Query Schemas ──────────────────────────────────────────────────────────

export const getNotificationsQuerySchema = z.object({
    limit: z.coerce.number().min(1).max(50).default(20),
    cursor: z.string().optional(),
    type: z.enum(["LIKE", "COMMENT", "REPLY", "MENTION", "FOLLOW"]).optional(),
});

export const markReadParamsSchema = z.object({
    id: z.string().uuid(),
});

// ─── Response Schemas (for Swagger docs) ────────────────────────────────────

export const notificationResponseSchema = z.object({
    id: z.string().uuid(),
    recipientId: z.string().uuid(),
    actorId: z.string().uuid().nullable(),
    type: z.enum(["LIKE", "COMMENT", "REPLY", "MENTION", "FOLLOW"]).nullable(),
    entityType: z.string(),
    entityId: z.string().uuid(),
    postId: z.string().uuid().nullable(),
    commentId: z.string().uuid().nullable(),
    message: z.string(),
    isRead: z.boolean(),
    metaData: z.any().nullable(),
    createdAt: z.string().datetime(),
    sender: z
        .object({
            id: z.string().uuid(),
            username: z.string(),
            name: z.string(),
            avatarUrl: z.string().nullable().optional(),
        })
        .nullable()
        .optional(),
});

export const paginatedNotificationsSchema = z.object({
    data: z.array(notificationResponseSchema),
    nextCursor: z.string().nullable(),
});

export const unreadCountSchema = z.object({
    count: z.number(),
});

// ─── Route Schemas ──────────────────────────────────────────────────────────

export const getNotificationsRouteSchema: FastifySchema = {
    querystring: getNotificationsQuerySchema,
    response: {
        200: paginatedNotificationsSchema,
    },
};

export const markReadRouteSchema: FastifySchema = {
    params: markReadParamsSchema,
    response: {
        200: z.object({ success: z.boolean() }),
    },
};

export const unreadCountRouteSchema: FastifySchema = {
    response: {
        200: unreadCountSchema,
    },
};
