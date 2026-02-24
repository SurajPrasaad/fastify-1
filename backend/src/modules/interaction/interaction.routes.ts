
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireAuth } from "../../middleware/auth.js";
import { optionalAuth } from "../../middleware/optional-auth.js";
import {
    toggleLikeHandler,
    toggleBookmarkHandler,
    createCommentHandler,
    getCommentsHandler,
    getRepliesHandler,
    createRepostHandler,
} from "./interaction.controller.js";
import { z } from "zod";
import {
    toggleLikeSchema,
    createCommentSchema,
    getCommentsSchema,
    getRepliesSchema,
    repostSchema,
} from "./interaction.schema.js";

export async function interactionRoutes(app: FastifyInstance) {
    const protectedApp = app.withTypeProvider<ZodTypeProvider>();

    app.get("/", async () => {
        return { message: "Interaction API is running" };
    });

    // --- Public Routes (with optional auth for isLiked status) ---
    const publicApp = app.withTypeProvider<ZodTypeProvider>();


    publicApp.get(
        "/post/:postId/comments",
        {
            schema: {
                params: z.object({
                    postId: z.string().uuid()
                }),
                querystring: getCommentsSchema,
                tags: ["Comments"],
                description: "Get root comments for a post",
            },
            preHandler: optionalAuth as any
        },
        getCommentsHandler
    );

    publicApp.get(
        "/comment/:parentId/replies",
        {
            schema: {
                params: z.object({
                    parentId: z.string().uuid()
                }),
                querystring: getRepliesSchema,
                tags: ["Comments"],
                description: "Get replies for a specific comment",
            },
            preHandler: optionalAuth as any
        },
        getRepliesHandler
    );

    // --- Protected Routes (require auth) ---
    app.register(async (protectedAppInstance) => {
        const protectedApp = protectedAppInstance.withTypeProvider<ZodTypeProvider>();
        protectedAppInstance.addHook("preHandler", requireAuth);

        // Likes
        protectedApp.post(
            "/like",
            {
                schema: {
                    body: toggleLikeSchema,
                    tags: ["Interactions"],
                    description: "Toggle like on a post or comment",
                },
            },
            toggleLikeHandler
        );

        // Bookmarks
        protectedApp.post(
            "/bookmark/:postId",
            {
                schema: {
                    params: z.object({
                        postId: z.string().uuid()
                    }),
                    tags: ["Interactions"],
                    description: "Toggle bookmark for a post",
                },
            },
            toggleBookmarkHandler
        );

        // Comments
        protectedApp.post(
            "/comment",
            {
                schema: {
                    body: createCommentSchema,
                    tags: ["Comments"],
                    description: "Add a comment or reply",
                },
            },
            createCommentHandler
        );

        // Reposts
        protectedApp.post(
            "/repost",
            {
                schema: {
                    body: repostSchema,
                    tags: ["Interactions"],
                    description: "Repost or quote a post",
                },
            },
            createRepostHandler
        );
    });
}
