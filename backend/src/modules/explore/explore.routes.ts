
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireAuth } from "../../middleware/auth.js";
import { z } from "zod";
import {
    getExploreFeedHandler,
    getTrendingFeedHandler,
    getCategoryFeedHandler,
    searchHandler,
    getCreatorsHandler,
    getTrendingHashtagsHandler,
    trackInteractionHandler,
} from "./explore.controller.js";
import {
    exploreFeedSchema,
    trendingFeedSchema,
    categoryFeedSchema,
    categoryParamsSchema,
    searchSchema,
    creatorsSchema,
    trendingHashtagsSchema,
    exploreInteractionSchema,
} from "./explore.schema.js";

export async function exploreRoutes(app: FastifyInstance) {
    const provider = app.withTypeProvider<ZodTypeProvider>();

    // ─── PUBLIC ROUTES ──────────────────────────────────────────────────

    // Personalized explore feed (works for both auth and anon)
    provider.get(
        "/",
        {
            schema: {
                tags: ["Explore"],
                description: "Get personalized explore/discovery feed. Authenticated users get personalized results, anonymous users get trending content.",
                querystring: exploreFeedSchema,
            },
        },
        getExploreFeedHandler
    );

    // Trending feed
    provider.get(
        "/trending",
        {
            schema: {
                tags: ["Explore"],
                description: "Get globally or regionally trending posts.",
                querystring: trendingFeedSchema,
            },
        },
        getTrendingFeedHandler
    );

    // Category discovery
    provider.get(
        "/category/:slug",
        {
            schema: {
                tags: ["Explore"],
                description: "Get posts for a specific category or topic.",
                params: categoryParamsSchema,
                querystring: categoryFeedSchema,
            },
        },
        getCategoryFeedHandler
    );

    // Search
    provider.get(
        "/search",
        {
            schema: {
                tags: ["Explore"],
                description: "Search posts, users, or hashtags.",
                querystring: searchSchema,
            },
        },
        searchHandler
    );

    // Creator recommendations
    provider.get(
        "/creators",
        {
            schema: {
                tags: ["Explore"],
                description: "Get recommended creators to follow.",
                querystring: creatorsSchema,
            },
        },
        getCreatorsHandler
    );

    // Trending hashtags
    provider.get(
        "/hashtags/trending",
        {
            schema: {
                tags: ["Explore"],
                description: "Get currently trending hashtags.",
                querystring: trendingHashtagsSchema,
            },
        },
        getTrendingHashtagsHandler
    );

    // ─── PROTECTED ROUTES ───────────────────────────────────────────────

    app.register(async (protectedApp) => {
        protectedApp.addHook("preHandler", requireAuth);
        const protectedProvider = protectedApp.withTypeProvider<ZodTypeProvider>();

        // Track user interaction for personalization
        protectedProvider.post(
            "/interaction",
            {
                schema: {
                    tags: ["Explore"],
                    description: "Track user interaction with a post for personalized recommendations.",
                    body: exploreInteractionSchema,
                    response: {
                        200: z.object({
                            success: z.boolean(),
                        }),
                    },
                },
            },
            trackInteractionHandler
        );
    });
}
