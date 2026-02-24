import { z } from "zod";
import type { FastifySchema } from "fastify";

// Shared Schemas
const commentCore = {
    content: z.string().min(1).max(5000), // Markdown support, but limit length
    parentId: z.string().uuid().optional(),
};

// Zod Schemas
export const createCommentSchema = z.object({
    postId: z.string().uuid(),
    ...commentCore,
});

export const getCommentsQuerySchema = z.object({
    limit: z.coerce.number().min(1).max(50).default(20),
    cursor: z.string().datetime().optional(), // ISO string
    parentId: z.string().uuid().optional(),
});

export const commentResponseSchema = z.object({
    id: z.string().uuid(),
    content: z.string(),
    likesCount: z.number(),
    repliesCount: z.number().optional().default(0),
    createdAt: z.date(),
    updatedAt: z.date(),
    user: z.object({
        id: z.string().uuid(),
        username: z.string(),
        name: z.string(),
        avatarUrl: z.string().nullable().optional(),
    }),
    parentId: z.string().uuid().nullable().optional(),
});

export const commentListResponseSchema = z.object({
    comments: z.array(commentResponseSchema),
    nextCursor: z.string().nullable().optional(),
})

// Fastify Route Schemas
export const createCommentRouteSchema: FastifySchema = {
    body: z.object({
        content: z.string().min(1),
        parentId: z.string().uuid().optional(),
    }),
    params: z.object({
        postId: z.string().uuid(),
    }),
    response: {
        201: commentResponseSchema
    }
};

export const getCommentsRouteSchema: FastifySchema = {
    params: z.object({
        postId: z.string().uuid(),
    }),
    querystring: getCommentsQuerySchema,
    response: {
        200: commentListResponseSchema
    }
};
