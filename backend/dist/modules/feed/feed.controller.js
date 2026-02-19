import { FeedService } from "./feed.service.js";
import { FeedRepository } from "./feed.repository.js";
const feedRepository = new FeedRepository();
const feedService = new FeedService(feedRepository);
export async function getHomeFeedHandler(request, reply) {
    const userId = request.user.sub; // Using JWT sub
    const { limit, cursor } = request.query;
    const posts = await feedService.getHomeFeed(userId, limit, cursor);
    // Using rankScore as cursor for ZSET pagination
    const lastPost = posts[posts.length - 1];
    const nextCursor = lastPost?.rankScore?.toString() ?? null;
    return reply.send({
        data: posts,
        meta: {
            nextCursor,
            count: posts.length,
            provider: "HYBRID_FANOUT_V1"
        }
    });
}
// In a real enterprise system, Explore/Hashtag might be handled by a separate Search/Discovery service.
// For completion, we keep placeholders that could use the same ranking logic.
export async function getExploreFeedHandler(request, reply) {
    return reply.status(501).send({ message: "Explore feed handled by Discovery Service" });
}
export async function getHashtagFeedHandler(request, reply) {
    return reply.status(501).send({ message: "Hashtag search handled by Search Service" });
}
//# sourceMappingURL=feed.controller.js.map