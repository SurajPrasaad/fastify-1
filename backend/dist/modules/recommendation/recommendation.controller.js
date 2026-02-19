import { RecommendationService } from "./recommendation.service.js";
import { getFeedSchema } from "./recommendation.schema.js";
import { z } from "zod";
const recommendationService = new RecommendationService();
export async function getForYouFeedHandler(request, reply) {
    const userId = request.session.userId;
    const limit = request.query.limit || 20;
    const posts = await recommendationService.getForYouFeed(userId, limit);
    return reply.send({ data: posts });
}
//# sourceMappingURL=recommendation.controller.js.map