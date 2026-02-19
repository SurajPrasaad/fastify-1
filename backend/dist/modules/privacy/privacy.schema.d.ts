import { z } from "zod";
import type { FastifySchema } from "fastify";
export declare const privacyConfigSchema: z.ZodObject<{
    profileVisibility: z.ZodEnum<{
        PUBLIC: "PUBLIC";
        FOLLOWERS: "FOLLOWERS";
        PRIVATE: "PRIVATE";
    }>;
    followersVisibility: z.ZodEnum<{
        PUBLIC: "PUBLIC";
        FOLLOWERS: "FOLLOWERS";
        PRIVATE: "PRIVATE";
    }>;
    followingVisibility: z.ZodEnum<{
        PUBLIC: "PUBLIC";
        FOLLOWERS: "FOLLOWERS";
        PRIVATE: "PRIVATE";
    }>;
    activityVisibility: z.ZodEnum<{
        PUBLIC: "PUBLIC";
        FOLLOWERS: "FOLLOWERS";
        PRIVATE: "PRIVATE";
    }>;
    searchVisibility: z.ZodBoolean;
}, z.core.$strip>;
export declare const updatePrivacySchema: z.ZodObject<{
    profileVisibility: z.ZodOptional<z.ZodEnum<{
        PUBLIC: "PUBLIC";
        FOLLOWERS: "FOLLOWERS";
        PRIVATE: "PRIVATE";
    }>>;
    followersVisibility: z.ZodOptional<z.ZodEnum<{
        PUBLIC: "PUBLIC";
        FOLLOWERS: "FOLLOWERS";
        PRIVATE: "PRIVATE";
    }>>;
    followingVisibility: z.ZodOptional<z.ZodEnum<{
        PUBLIC: "PUBLIC";
        FOLLOWERS: "FOLLOWERS";
        PRIVATE: "PRIVATE";
    }>>;
    activityVisibility: z.ZodOptional<z.ZodEnum<{
        PUBLIC: "PUBLIC";
        FOLLOWERS: "FOLLOWERS";
        PRIVATE: "PRIVATE";
    }>>;
    searchVisibility: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const getPrivacyRouteSchema: FastifySchema;
export declare const updatePrivacyRouteSchema: FastifySchema;
//# sourceMappingURL=privacy.schema.d.ts.map