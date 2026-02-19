import { RecommendationService } from "./recommendation.service.js";
import { trackEventSchema } from "./recommendation.schema.js";
import { z } from "zod";
const recommendationService = new RecommendationService();
export async function trackInteractionHandler(request, reply) {
    const userId = request.session.userId; // Assumes session middleware populates userId
    const { postId, action, duration } = request.body;
    // Fire and Forget pattern for analytics to avoid blocking response?
    // Or await to ensure it's tracked. Awaiting is safer for now.
    await recommendationService.trackInteraction(userId, {
        postId,
        action,
        duration,
    });
    return reply.code(200).send({ success: true });
}
//# sourceMappingURL=analytics.controller.js.map