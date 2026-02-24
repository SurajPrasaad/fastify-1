
import { z } from "zod";

export const resourceTypeSchema = z.enum(["POST", "COMMENT"]);

export const toggleLikeSchema = z.object({
    resourceId: z.string().uuid(),
    resourceType: resourceTypeSchema,
});

export const toggleBookmarkSchema = z.object({
    postId: z.string().uuid(),
});

export const createCommentSchema = z.object({
    postId: z.string().uuid(),
    parentId: z.string().uuid().optional(),
    content: z.string().min(1).max(2000),
});

export const getCommentsSchema = z.object({
    postId: z.string().uuid(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z.string().optional(), // Cursor is typically a timestamp or ID
});

export const getRepliesSchema = z.object({
    parentId: z.string().uuid(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z.string().optional(),
});

export const getUserRepliesSchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z.string().optional(),
});

export const repostSchema = z.object({
    postId: z.string().uuid(),
    content: z.string().max(2000).optional(),
});
