
import type { FastifyReply, FastifyRequest } from "fastify";
import type { getFeedSchema, getExploreFeedSchema, getHashtagFeedSchema, getHashtagParamsSchema } from "./feed.schema.js";
import { FeedService } from "./feed.service.js";
import { FeedRepository } from "./feed.repository.js";
import type { z } from "zod";

const feedRepository = new FeedRepository();
const feedService = new FeedService(feedRepository);

export async function getHomeFeedHandler(
    request: FastifyRequest<{ Querystring: z.infer<typeof getFeedSchema> }>,
    reply: FastifyReply
) {
    const userId = request.user!.sub; // Using JWT sub
    const { limit, cursor } = request.query;

    const posts = await feedService.getHomeFeed(userId, limit, cursor);

    // Using rankScore as cursor for ZSET pagination
    const lastPost = posts[posts.length - 1] as any;
    const nextCursor = lastPost?.rankScore?.toString() ?? null;

    return reply.send({
        data: posts,
        nextCursor,
        hasMore: !!nextCursor,
        meta: {
            count: posts.length,
            provider: "HYBRID_FANOUT_V1"
        }
    });
}

// Global Explore Feed
export async function getExploreFeedHandler(
    request: FastifyRequest<{ Querystring: z.infer<typeof getExploreFeedSchema> }>,
    reply: FastifyReply
) {
    const { limit, cursor } = request.query;
    const posts = await feedService.getExploreFeed(limit, cursor);

    const lastPost = posts[posts.length - 1] as any;
    const nextCursor = lastPost?.publishedAt?.toISOString() ?? null;

    return reply.send({
        data: posts,
        nextCursor,
        hasMore: !!nextCursor,
        meta: {
            count: posts.length,
            provider: "GLOBAL_RANKING_V1"
        }
    });
}

// Hashtag Specific Feed
export async function getHashtagFeedHandler(
    request: FastifyRequest<{
        Params: z.infer<typeof getHashtagParamsSchema>,
        Querystring: z.infer<typeof getHashtagFeedSchema>
    }>,
    reply: FastifyReply
) {
    const { tag } = request.params;
    const { limit, cursor } = request.query;

    const posts = await feedService.getHashtagFeed(tag, limit, cursor);

    const lastPost = posts[posts.length - 1] as any;
    const nextCursor = lastPost?.publishedAt?.toISOString() ?? null;

    return reply.send({
        data: posts,
        nextCursor,
        hasMore: !!nextCursor,
        meta: {
            count: posts.length,
            provider: "TAG_FILTER_V1"
        }
    });
}
