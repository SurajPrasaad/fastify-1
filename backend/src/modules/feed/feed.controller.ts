
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
    const userId = request.user!.sub;
    const { limit, cursor, type } = request.query;

    const posts = await feedService.getFeed(userId, type as any, limit, cursor);

    // Determine cursor strategy based on feed type
    const lastPost = posts[posts.length - 1] as any;
    let nextCursor = null;

    if (lastPost) {
        if (type === 'FOR_YOU') {
            nextCursor = lastPost.finalScore?.toString() || lastPost.rankScore?.toString();
        } else {
            nextCursor = lastPost.publishedAt?.getTime()?.toString() || lastPost.publishedAt?.toISOString();
        }
    }

    return reply.send({
        data: posts,
        nextCursor,
        hasMore: !!nextCursor && posts.length >= limit,
        meta: {
            count: posts.length,
            type: type,
            provider: "SEGMENTED_FEED_V2"
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
    const nextCursor = lastPost ? (lastPost.publishedAt || lastPost.createdAt)?.toISOString() : null;

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
