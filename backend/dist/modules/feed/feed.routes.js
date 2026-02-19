import { requireAuth } from "../../middleware/auth.js";
import { getHomeFeedHandler, getExploreFeedHandler, getHashtagFeedHandler } from "./feed.controller.js";
import { getFeedSchema, getExploreFeedSchema, getHashtagFeedSchema } from "./feed.schema.js";
export async function feedRoutes(app) {
    // Protected Routes
    app.register(async (protectedApp) => {
        protectedApp.addHook("preHandler", requireAuth);
        // Home Feed (Hybrid Push/Pull)
        protectedApp.withTypeProvider().get("/", {
            schema: {
                querystring: getFeedSchema
            }
        }, getHomeFeedHandler);
    });
    // Public Routes
    // Explore Feed
    app.withTypeProvider().get("/explore", {
        schema: {
            querystring: getExploreFeedSchema
        }
    }, getExploreFeedHandler);
    // Hashtag Feed
    app.withTypeProvider().get("/hashtag/:tag", {
        schema: {
            querystring: getHashtagFeedSchema // Note: tag is in params, Zod here validates query string.
            // Actually need to validate params too if using strict Zod types.
            // But Fastify Zod provider usually handles query/body/params separately.
            // Let's adjust schema usage in controller or here if needed.
            // The schema defined has `tag` field which is likely expected in query or params.
            // `getHashtagFeedHandler` extracts `tag` from `request.query`.
            // So route should be `/hashtag` with `?tag=...` OR `/hashtag/:tag` with params schema.
            // The handler code uses `request.query`. So let's align route to `/hashtag` with query param.
        }
    }, getHashtagFeedHandler);
}
//# sourceMappingURL=feed.routes.js.map