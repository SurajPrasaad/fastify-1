
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireAuth } from "../../middleware/auth.js";
import { trackInteractionHandler } from "./analytics.controller.js";
import { getForYouFeedHandler } from "./recommendation.controller.js";
import { z } from "zod";
import { trackEventSchema, getFeedSchema } from "./recommendation.schema.js";

export async function recommendationRoutes(app: FastifyInstance) {
    app.get("/", async () => {
        return { message: "Recommendation API is running" };
    });

    // Protected Routes
    // Since personalized feed and tracking require authenticated user context
    app.register(async (protectedApp) => {
        protectedApp.addHook("preHandler", requireAuth);

        // Analytics Tracking Endpoint
        // POST /analytics/track
        protectedApp.withTypeProvider<ZodTypeProvider>().post(
            "/analytics/track",
            {
                schema: {
                    body: trackEventSchema,
                    description: "Track user interaction for personalized recommendations",
                    tags: ["Analytics"],
                    response: {
                        200: z.object({
                            success: z.boolean()
                        })
                    }
                }
            },
            trackInteractionHandler
        );

        // Personalized Feed Endpoint
        // GET /feed/for-you
        protectedApp.withTypeProvider<ZodTypeProvider>().get(
            "/feed/for-you",
            {
                schema: {
                    querystring: getFeedSchema,
                    description: "Get personalized feed based on user interests",
                    tags: ["Feed"]
                }
            },
            getForYouFeedHandler
        );
    });
}
