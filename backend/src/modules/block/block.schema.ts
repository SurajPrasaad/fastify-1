import { z } from "zod";
import type { FastifySchema } from "fastify";

export const blockParamsSchema = z.object({
    id: z.string().uuid(),
});

export const blockResponseSchema = z.object({
    success: z.boolean(),
});

export const blockUserRouteSchema: FastifySchema = {
    description: "Block a user",
    tags: ["Social"],
    params: blockParamsSchema,
    response: {
        200: blockResponseSchema,
    },
};

export const unblockUserRouteSchema: FastifySchema = {
    description: "Unblock a user",
    tags: ["Social"],
    params: blockParamsSchema,
    response: {
        200: blockResponseSchema,
    },
};
export const blockStatusSchema = z.object({
    isBlocked: z.boolean(),
    isBlockedBy: z.boolean(),
});

export const blockedUserListSchema = z.array(z.object({
    id: z.string(),
    userId: z.string(),
    username: z.string(),
    name: z.string(),
    avatarUrl: z.string().nullable().optional(),
    blockedAt: z.date(),
}));

export const getBlockedUsersRouteSchema: FastifySchema = {
    description: "Get blocked users",
    tags: ["Social"],
    response: {
        200: blockedUserListSchema,
    },
};

export const getBlockStatusRouteSchema: FastifySchema = {
    description: "Get block status between users",
    tags: ["Social"],
    params: blockParamsSchema,
    response: {
        200: blockStatusSchema,
    },
};
