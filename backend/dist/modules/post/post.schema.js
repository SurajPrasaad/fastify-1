import { z } from "zod";
const postCore = {
    content: z.string().min(1).max(3000),
    codeSnippet: z.string().optional(),
    language: z.string().max(50).optional(),
    mediaUrls: z.array(z.string().url()).optional().default([]),
};
export const createPostSchema = z.object({
    ...postCore,
}).refine((data) => {
    if (data.codeSnippet && !data.language) {
        return false;
    }
    return true;
}, {
    message: "Language is required when code snippet is provided",
    path: ["language"],
});
export const updatePostSchema = z.object({
    content: z.string().min(1).max(3000).optional(),
    codeSnippet: z.string().optional(),
    language: z.string().max(50).optional(),
    mediaUrls: z.array(z.string().url()).optional(),
}).refine((data) => {
    if (data.codeSnippet && !data.language) {
        return false;
    }
    return true;
}, {
    message: "Language is required when code snippet is provided",
    path: ["language"],
});
export const postResponseSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    content: z.string(),
    codeSnippet: z.string().nullable().optional(),
    language: z.string().nullable().optional(),
    mediaUrls: z.array(z.string()),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'DELETED']),
    commentsCount: z.number(),
    likesCount: z.number(),
    publishedAt: z.date().nullable().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    author: z.object({
        username: z.string(),
        name: z.string(),
    }).optional(),
});
export const getPostsQuerySchema = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().min(1).max(50).default(10),
});
//# sourceMappingURL=post.schema.js.map