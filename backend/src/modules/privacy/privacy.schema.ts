import { z } from "zod";
import type { FastifySchema } from "fastify";

export const privacyConfigSchema = z.object({
    profileVisibility: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE"]),
    followersVisibility: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE"]),
    followingVisibility: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE"]),
    activityVisibility: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE"]),
    searchVisibility: z.boolean(),
});

export const updatePrivacySchema = privacyConfigSchema.partial();

export const getPrivacyRouteSchema: FastifySchema = {
    description: "Get user privacy settings",
    tags: ["Privacy"],
    response: {
        200: privacyConfigSchema,
    },
};

export const updatePrivacyRouteSchema: FastifySchema = {
    description: "Update user privacy settings",
    tags: ["Privacy"],
    body: updatePrivacySchema,
    response: {
        200: privacyConfigSchema,
    },
};
