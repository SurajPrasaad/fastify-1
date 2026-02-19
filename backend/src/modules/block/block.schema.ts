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
