import { z } from "zod";
export declare const createPostSchema: z.ZodObject<{
    content: z.ZodString;
    codeSnippet: z.ZodOptional<z.ZodString>;
    language: z.ZodOptional<z.ZodString>;
    mediaUrls: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
}, z.core.$strip>;
export declare const updatePostSchema: z.ZodObject<{
    content: z.ZodOptional<z.ZodString>;
    codeSnippet: z.ZodOptional<z.ZodString>;
    language: z.ZodOptional<z.ZodString>;
    mediaUrls: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const postResponseSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    content: z.ZodString;
    codeSnippet: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    language: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    mediaUrls: z.ZodArray<z.ZodString>;
    status: z.ZodEnum<{
        DELETED: "DELETED";
        DRAFT: "DRAFT";
        PUBLISHED: "PUBLISHED";
        ARCHIVED: "ARCHIVED";
    }>;
    commentsCount: z.ZodNumber;
    likesCount: z.ZodNumber;
    publishedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    author: z.ZodOptional<z.ZodObject<{
        username: z.ZodString;
        name: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const getPostsQuerySchema: z.ZodObject<{
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
//# sourceMappingURL=post.schema.d.ts.map