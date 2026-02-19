import { requireAuth } from "../../middleware/auth.js";
import { EngagementController } from "./engagement.controller.js";
import { EngagementService } from "./engagement.service.js";
import { EngagementRepository } from "./engagement.repository.js";
import { toggleLikeSchema, reactSchema, repostSchema } from "./engagement.schema.js";
export async function engagementRoutes(app) {
    const repository = new EngagementRepository();
    const service = new EngagementService(repository);
    const controller = new EngagementController(service);
    const provider = app.withTypeProvider();
    // Public Routes
    provider.get("/stats/:targetId", {
        schema: {
            tags: ["Engagement"],
            description: "Get real-time engagement counters for a post or comment",
        }
    }, controller.getStatsHandler);
    // Protected Routes
    app.register(async (protectedApp) => {
        const protectedProvider = protectedApp.withTypeProvider();
        protectedApp.addHook("preHandler", requireAuth);
        protectedProvider.post("/like", {
            schema: {
                body: toggleLikeSchema,
                tags: ["Engagement"],
                description: "Toggle like for a post or comment",
            }
        }, controller.toggleLikeHandler);
        protectedProvider.post("/react", {
            schema: {
                body: reactSchema,
                tags: ["Engagement"],
                description: "Add or change a reaction",
            }
        }, controller.reactHandler);
        protectedProvider.post("/repost", {
            schema: {
                body: repostSchema,
                tags: ["Engagement"],
                description: "Repost or Quote-repost a post",
            }
        }, controller.repostHandler);
    });
}
//# sourceMappingURL=engagement.routes.js.map