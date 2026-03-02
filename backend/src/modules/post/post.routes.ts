
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireAuth } from "../../middleware/auth.js";
import {
    createPostHandler,
    getPostsHandler,
    getPostHandler,
    getPostsByTagHandler,
    updatePostHandler,
    archivePostHandler,
    deletePostHandler,
    publishDraftHandler,
    submitForReviewHandler,
    resubmitHandler,
    votePollHandler
} from "./post.controller.js";
import {
    createPostSchema,
    updatePostSchema,
    getPostsQuerySchema
} from "./post.schema.js";

import { z } from "zod";

export async function postRoutes(app: FastifyInstance) {
    const provider = app.withTypeProvider<ZodTypeProvider>();

    // ─── Public Routes (only returns PUBLISHED posts) ────

    provider.get(
        "/",
        {
            schema: {
                querystring: getPostsQuerySchema,
                tags: ["Posts"],
            }
        },
        getPostsHandler
    );

    provider.get(
        "/hashtag/:tag",
        {
            schema: {
                params: z.object({ tag: z.string() }),
                querystring: z.object({
                    cursor: z.string().optional(),
                    limit: z.coerce.number().min(1).max(50).default(10),
                }),
                tags: ["Posts"],
            }
        },
        getPostsByTagHandler
    );

    provider.get(
        "/:id",
        {
            schema: {
                tags: ["Posts"],
            }
        },
        getPostHandler
    );

    // ─── Protected Routes (authenticated users) ──────────

    app.register(async (protectedApp) => {
        const protectedProvider = protectedApp.withTypeProvider<ZodTypeProvider>();
        protectedApp.addHook("preHandler", requireAuth);

        // Create post (defaults to PENDING_REVIEW)
        protectedProvider.post(
            "/",
            {
                schema: {
                    body: createPostSchema,
                    tags: ["Posts"],
                }
            },
            createPostHandler
        );

        // Submit draft for review (DRAFT → PENDING_REVIEW)
        protectedProvider.post(
            "/:id/submit",
            {
                schema: {
                    tags: ["Posts"],
                }
            },
            submitForReviewHandler
        );

        // Legacy: "publish" now means "submit for review"
        protectedProvider.post(
            "/:id/publish",
            {
                schema: {
                    tags: ["Posts"],
                }
            },
            publishDraftHandler
        );

        // Resubmit after revision/rejection
        protectedProvider.post(
            "/:id/resubmit",
            {
                schema: {
                    body: updatePostSchema,
                    tags: ["Posts"],
                }
            },
            resubmitHandler
        );

        // Update post (only in DRAFT/NEEDS_REVISION/REJECTED states)
        protectedProvider.put(
            "/:id",
            {
                schema: {
                    body: updatePostSchema,
                    tags: ["Posts"],
                }
            },
            updatePostHandler
        );

        protectedProvider.put(
            "/:id/archive",
            {
                schema: {
                    tags: ["Posts"],
                }
            },
            archivePostHandler
        );

        protectedProvider.delete(
            "/:id",
            {
                schema: {
                    tags: ["Posts"],
                }
            },
            deletePostHandler
        );

        protectedProvider.post(
            "/polls/:id/vote",
            {
                schema: {
                    params: z.object({ id: z.string().uuid() }),
                    body: z.object({ optionId: z.string().uuid() }),
                    tags: ["Posts"],
                }
            },
            votePollHandler
        );

    });
}

