
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireAuth } from "../../middleware/auth.js";
import {
    createPostHandler,
    getPostsHandler,
    getPostHandler,
    updatePostHandler,
    archivePostHandler,
    deletePostHandler,
    publishDraftHandler
} from "./post.controller.js";
import {
    createPostSchema,
    updatePostSchema,
    getPostsQuerySchema
} from "./post.schema.js";

export async function postRoutes(app: FastifyInstance) {
    const provider = app.withTypeProvider<ZodTypeProvider>();

    // Public Routes
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
        "/:id",
        {
            schema: {
                tags: ["Posts"],
            }
        },
        getPostHandler
    );

    // Protected Routes
    app.register(async (protectedApp) => {
        const protectedProvider = protectedApp.withTypeProvider<ZodTypeProvider>();
        protectedApp.addHook("preHandler", requireAuth);

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

        protectedProvider.post(
            "/:id/publish",
            {
                schema: {
                    tags: ["Posts"],
                }
            },
            publishDraftHandler
        );

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

    });
}
