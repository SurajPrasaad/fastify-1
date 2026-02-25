
import type { FastifyReply, FastifyRequest } from "fastify";
import type { z } from "zod";
import { ExploreService } from "./explore.service.js";
import type {
    exploreFeedSchema,
    trendingFeedSchema,
    categoryFeedSchema,
    categoryParamsSchema,
    searchSchema,
    creatorsSchema,
    trendingHashtagsSchema,
    exploreInteractionSchema,
} from "./explore.schema.js";

const exploreService = new ExploreService();

// ─── GET /api/explore ────────────────────────────────────────────────────────
export async function getExploreFeedHandler(
    request: FastifyRequest<{ Querystring: z.infer<typeof exploreFeedSchema> }>,
    reply: FastifyReply
) {
    const userId = request.session?.userId;
    const { limit, cursor, region } = request.query;

    const result = await exploreService.getExploreFeed(userId, limit, cursor, region);
    return reply.send(result);
}

// ─── GET /api/explore/trending ───────────────────────────────────────────────
export async function getTrendingFeedHandler(
    request: FastifyRequest<{ Querystring: z.infer<typeof trendingFeedSchema> }>,
    reply: FastifyReply
) {
    const { limit, cursor, region, timeWindow } = request.query;

    const result = await exploreService.getTrendingFeed(limit, cursor, region, timeWindow);
    return reply.send(result);
}

// ─── GET /api/explore/category/:slug ─────────────────────────────────────────
export async function getCategoryFeedHandler(
    request: FastifyRequest<{
        Params: z.infer<typeof categoryParamsSchema>;
        Querystring: z.infer<typeof categoryFeedSchema>;
    }>,
    reply: FastifyReply
) {
    const { slug } = request.params;
    const { limit, cursor } = request.query;
    const userId = request.session?.userId;

    const result = await exploreService.getCategoryFeed(slug, limit, cursor, userId);
    return reply.send(result);
}

// ─── GET /api/explore/search ─────────────────────────────────────────────────
export async function searchHandler(
    request: FastifyRequest<{ Querystring: z.infer<typeof searchSchema> }>,
    reply: FastifyReply
) {
    const { q, limit, cursor, type } = request.query;

    const result = await exploreService.search(q, limit, cursor, type);
    return reply.send(result);
}

// ─── GET /api/explore/creators ───────────────────────────────────────────────
export async function getCreatorsHandler(
    request: FastifyRequest<{ Querystring: z.infer<typeof creatorsSchema> }>,
    reply: FastifyReply
) {
    const userId = request.session?.userId;
    const { limit, category } = request.query;

    const result = await exploreService.getRecommendedCreators(limit, userId, category);
    return reply.send(result);
}

// ─── GET /api/explore/hashtags/trending ──────────────────────────────────────
export async function getTrendingHashtagsHandler(
    request: FastifyRequest<{ Querystring: z.infer<typeof trendingHashtagsSchema> }>,
    reply: FastifyReply
) {
    const { limit } = request.query;

    const result = await exploreService.getTrendingHashtags(limit);
    return reply.send(result);
}

// ─── POST /api/explore/interaction ──────────────────────────────────────────
export async function trackInteractionHandler(
    request: FastifyRequest<{ Body: z.infer<typeof exploreInteractionSchema> }>,
    reply: FastifyReply
) {
    const userId = request.session.userId!;
    const { postId, action, duration } = request.body;

    // Fire and await to ensure tracking is recorded
    await exploreService.trackInteraction(userId, postId, action, duration);

    return reply.code(200).send({ success: true });
}
