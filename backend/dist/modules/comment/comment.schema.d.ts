import { z } from "zod";
import type { FastifySchema } from "fastify";
export declare const createCommentSchema: z.ZodObject<{
    content: z.ZodString;
    parentId: z.ZodOptional<z.ZodString>;
    postId: z.ZodString;
}, z.core.$strip>;
export declare const getCommentsQuerySchema: z.ZodObject<{
    postId: z.ZodString;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    cursor: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const commentResponseSchema: z.ZodObject<{
    id: z.ZodString;
    content: z.ZodString;
    likesCount: z.ZodNumber;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    user: z.ZodObject<{
        id: z.ZodString;
        username: z.ZodString;
        name: z.ZodString;
    }, z.core.$strip>;
    parentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const commentListResponseSchema: z.ZodObject<{
    comments: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        content: z.ZodString;
        likesCount: z.ZodNumber;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        user: z.ZodObject<{
            id: z.ZodString;
            username: z.ZodString;
            name: z.ZodString;
        }, z.core.$strip>;
        parentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>>;
    nextCursor: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const createCommentRouteSchema: FastifySchema;
export declare const getCommentsRouteSchema: FastifySchema;
//# sourceMappingURL=comment.schema.d.ts.map