
import { z } from "zod";

const postCore = {
    content: z.string().max(3000).optional().default(""),
    codeSnippet: z.string().optional(),
    language: z.string().max(50).optional(),
    mediaUrls: z.array(z.string()).optional().default([]),
    location: z.string().optional().nullable(),
    poll: z.object({
        options: z.array(z.string().min(1)).min(2).max(4),
        expiresAt: z.coerce.date(),
    }).optional().nullable(),
};

export const createPostSchema = z.object({
    ...postCore,
}).refine((data) => {
    // Check if at least one of the primary content types is present
    const hasContent = data.content && data.content.trim().length > 0;
    const hasMedia = data.mediaUrls && data.mediaUrls.length > 0;
    const hasPoll = !!data.poll;
    const hasCode = !!data.codeSnippet;

    return !!(hasContent || hasMedia || hasPoll || hasCode);
}, {
    message: "Post must have either content, media, code, or a poll",
    path: ["content"],
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
    location: z.string().optional().nullable(),
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
    location: z.string().nullable().optional(),
    pollId: z.string().uuid().nullable().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'DELETED']),
    commentsCount: z.number(),
    likesCount: z.number(),
    publishedAt: z.date().nullable().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    author: z.object({
        username: z.string(),
        name: z.string(),
        avatarUrl: z.string().nullable().optional(),
    }).optional(),
    poll: z.object({
        id: z.string().uuid(),
        options: z.array(z.object({
            id: z.string().uuid(),
            text: z.string(),
            votesCount: z.number(),
        })),
        expiresAt: z.date(),
        userVotedOptionId: z.string().uuid().nullable().optional(),
    }).nullable().optional(),
});


export const getPostsQuerySchema = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().min(1).max(50).default(10),
    authorUsername: z.string().optional(),
    authorId: z.string().uuid().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
