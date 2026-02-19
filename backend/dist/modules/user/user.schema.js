import { z } from "zod";
// Shared Schemas
const userCore = {
    username: z.string().min(3).max(30),
    email: z.string().email(),
    name: z.string().min(2),
    bio: z.string().max(160).nullable().optional(),
    techStack: z.array(z.string()).default([]),
    avatarUrl: z.string().url().nullable().optional(),
};
const userResponse = z.object({
    id: z.string().uuid(),
    ...userCore,
    followersCount: z.number().int(),
    followingCount: z.number().int(),
    postsCount: z.number().int(),
    createdAt: z.union([z.date(), z.string()]),
    updatedAt: z.union([z.date(), z.string()]),
});
// Zod Schemas
export const createUserSchema = z.object({
    ...userCore,
    password: z.string().min(8),
});
export const updateUserSchema = z.object({
    name: z.string().min(2).optional(),
    techStack: z.array(z.string()).optional(),
    bio: z.string().max(160).optional(),
    avatarUrl: z.string().url().nullable().optional(),
});
export const userParamsSchema = z.object({
    username: z.string(),
});
export const userIdParamsSchema = z.object({
    id: z.string().uuid(),
});
// Fastify Route Schemas
export const createUserRouteSchema = {
    body: createUserSchema,
    response: {
        201: userResponse,
    },
};
export const getUserProfileSchema = {
    params: userParamsSchema,
    // response: { 200: userResponse }, // Omitted for brevity/flexibility in response wrapper
};
export const followUserSchema = {
    params: userIdParamsSchema,
};
export const unfollowUserSchema = {
    params: userIdParamsSchema,
};
export const getSuggestionsSchema = {
    querystring: z.object({
        userId: z.string().uuid(),
    }),
};
export const getByTechStackSchema = {
    querystring: z.object({
        tech: z.string()
    })
};
export const getAllUsersSchema = {
    querystring: z.object({
        limit: z.coerce.number().positive().default(20),
        offset: z.coerce.number().nonnegative().default(0),
    }),
};
export const updateProfileRouteSchema = {
    body: updateUserSchema,
    response: {
        200: userResponse,
    },
};
//# sourceMappingURL=user.schema.js.map