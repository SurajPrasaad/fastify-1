import { z } from "zod";
export declare const createUserSchema: z.ZodObject<{
    password: z.ZodString;
    username: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    bio: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    techStack: z.ZodDefault<z.ZodArray<z.ZodString>>;
    avatarUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const updateUserSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    techStack: z.ZodOptional<z.ZodArray<z.ZodString>>;
    bio: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const userParamsSchema: z.ZodObject<{
    username: z.ZodString;
}, z.core.$strip>;
export declare const userIdParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const createUserRouteSchema: {
    body: z.ZodObject<{
        password: z.ZodString;
        username: z.ZodString;
        email: z.ZodString;
        name: z.ZodString;
        bio: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        techStack: z.ZodDefault<z.ZodArray<z.ZodString>>;
        avatarUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>;
    response: {
        201: z.ZodObject<{
            followersCount: z.ZodNumber;
            followingCount: z.ZodNumber;
            postsCount: z.ZodNumber;
            createdAt: z.ZodUnion<readonly [z.ZodDate, z.ZodString]>;
            updatedAt: z.ZodUnion<readonly [z.ZodDate, z.ZodString]>;
            username: z.ZodString;
            email: z.ZodString;
            name: z.ZodString;
            bio: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            techStack: z.ZodDefault<z.ZodArray<z.ZodString>>;
            avatarUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            id: z.ZodString;
        }, z.core.$strip>;
    };
};
export declare const getUserProfileSchema: {
    params: z.ZodObject<{
        username: z.ZodString;
    }, z.core.$strip>;
};
export declare const followUserSchema: {
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
};
export declare const unfollowUserSchema: {
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
};
export declare const getSuggestionsSchema: {
    querystring: z.ZodObject<{
        userId: z.ZodString;
    }, z.core.$strip>;
};
export declare const getByTechStackSchema: {
    querystring: z.ZodObject<{
        tech: z.ZodString;
    }, z.core.$strip>;
};
export declare const getAllUsersSchema: {
    querystring: z.ZodObject<{
        limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
        offset: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    }, z.core.$strip>;
};
export declare const updateProfileRouteSchema: {
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        techStack: z.ZodOptional<z.ZodArray<z.ZodString>>;
        bio: z.ZodOptional<z.ZodString>;
        avatarUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>;
    response: {
        200: z.ZodObject<{
            followersCount: z.ZodNumber;
            followingCount: z.ZodNumber;
            postsCount: z.ZodNumber;
            createdAt: z.ZodUnion<readonly [z.ZodDate, z.ZodString]>;
            updatedAt: z.ZodUnion<readonly [z.ZodDate, z.ZodString]>;
            username: z.ZodString;
            email: z.ZodString;
            name: z.ZodString;
            bio: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            techStack: z.ZodDefault<z.ZodArray<z.ZodString>>;
            avatarUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            id: z.ZodString;
        }, z.core.$strip>;
    };
};
//# sourceMappingURL=user.schema.d.ts.map