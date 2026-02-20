
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireAuth } from "../../middleware/auth.js";
import {
    getHomeFeedHandler,
    getExploreFeedHandler,
    getHashtagFeedHandler
} from "./feed.controller.js";
import {
    getFeedSchema,
    getExploreFeedSchema,
    getHashtagFeedSchema,
    getHashtagParamsSchema
} from "./feed.schema.js";

export async function feedRoutes(app: FastifyInstance) {
    // Protected Routes
    app.register(async (protectedApp) => {
        protectedApp.addHook("preHandler", requireAuth);

        // Home Feed (Hybrid Push/Pull)
        protectedApp.withTypeProvider<ZodTypeProvider>().get(
            "/",
            {
                schema: {
                    querystring: getFeedSchema
                }
            },
            getHomeFeedHandler
        );
    });

    // Public Routes
    // Explore Feed
    app.withTypeProvider<ZodTypeProvider>().get(
        "/explore",
        {
            schema: {
                querystring: getExploreFeedSchema
            }
        },
        getExploreFeedHandler
    );

    // Hashtag Feed
    app.withTypeProvider<ZodTypeProvider>().get(
        "/hashtag/:tag",
        {
            schema: {
                params: getHashtagParamsSchema,
                querystring: getHashtagFeedSchema
            }
        },
        getHashtagFeedHandler
    );
}
