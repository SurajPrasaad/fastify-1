/**
 * Post tRPC Router — Pre-Moderation Publishing Model
 * 
 * Key changes:
 * - submitForReview: Submit a draft for moderation
 * - resubmit: Resubmit after revision/rejection
 * - getUserPosts: View own posts (all statuses)
 * - getById: Public view (only PUBLISHED)
 */

import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { z } from "zod";
import { PostService } from "../../modules/post/post.service.js";
import { PostRepository } from "../../modules/post/post.repository.js";

const repository = new PostRepository();
const service = new PostService(repository);

export const postRouter = router({

    // ─── Public Routes ───────────────────────────────────

    getById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input, ctx }) => {
            return await service.getPost(input.id, ctx.user?.id);
        }),

    // ─── Protected Routes ────────────────────────────────

    // Detailed post view (with moderation metadata for owner/admin)
    getDetailedById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input, ctx }) => {
            return await repository.findByIdHydrated(input.id, ctx.user.id);
        }),

    // Submit a draft for moderation review
    submitForReview: protectedProcedure
        .input(z.object({ postId: z.string().uuid() }))
        .mutation(async ({ input, ctx }) => {
            return await service.submitForReview(input.postId, ctx.user.id);
        }),

    // Resubmit after revision or rejection
    resubmit: protectedProcedure
        .input(z.object({
            postId: z.string().uuid(),
            content: z.string().max(3000).optional(),
            codeSnippet: z.string().optional(),
            language: z.string().max(50).optional(),
            mediaUrls: z.array(z.string()).optional(),
        }))
        .mutation(async ({ input, ctx }) => {
            const { postId, ...updateData } = input;
            const hasUpdates = Object.values(updateData).some(v => v !== undefined);
            return await service.resubmitPost(
                postId,
                ctx.user.id,
                hasUpdates ? updateData : undefined
            );
        }),

    // Get user's own posts (all statuses)
    getUserPosts: protectedProcedure
        .input(z.object({
            limit: z.number().optional().default(20),
            cursor: z.string().optional(),
        }))
        .query(async ({ input, ctx }) => {
            return await service.getUserPosts(ctx.user.id, input.limit, input.cursor);
        }),

    // Admin view for fetching all posts
    getAllAdmin: protectedProcedure
        .input(z.object({
            limit: z.number().optional().default(50),
            cursor: z.string().optional()
        }))
        .query(async ({ input, ctx }) => {
            return await service.getFeed(input.limit, input.cursor, ctx.user.id, {
                includeDeleted: true
            });
        }),
});
