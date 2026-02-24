
import type { FastifyReply, FastifyRequest } from "fastify";
import { InteractionService } from "./interaction.service.js";
import type {
    ToggleLikeInput,
    ToggleBookmarkInput,
    CreateCommentInput,
    GetCommentsQuery,
    GetRepliesQuery,
    GetUserRepliesQuery,
    RepostInput
} from "./interaction.dto.js";

const service = new InteractionService();

export async function toggleLikeHandler(
    request: FastifyRequest<{ Body: ToggleLikeInput }>,
    reply: FastifyReply
) {
    const userId = request.user!.sub;
    const result = await service.toggleLike(
        userId,
        request.body.resourceId,
        request.body.resourceType
    );
    return reply.send(result);
}

export async function toggleBookmarkHandler(
    request: FastifyRequest<{ Params: { postId: string } }>,
    reply: FastifyReply
) {
    const userId = request.user!.sub;
    const result = await service.toggleBookmark(userId, request.params.postId);
    return reply.send(result);
}

export async function createCommentHandler(
    request: FastifyRequest<{ Body: CreateCommentInput }>,
    reply: FastifyReply
) {
    const userId = request.user!.sub;
    const comment = await service.addComment(userId, request.body);
    return reply.status(201).send(comment);
}

export async function getCommentsHandler(
    request: FastifyRequest<{ Params: { postId: string }; Querystring: GetCommentsQuery }>,
    reply: FastifyReply
) {
    const userId = request.user?.sub;
    const comments = await service.getPostComments(
        request.params.postId,
        request.query.limit,
        request.query.cursor,
        userId
    );

    const nextCursor = comments.length > 0 ? (comments[comments.length - 1] as any).createdAt.toISOString() : null;

    return reply.send({
        data: comments,
        meta: { nextCursor }
    });
}

export async function getRepliesHandler(
    request: FastifyRequest<{ Params: { parentId: string }; Querystring: GetRepliesQuery }>,
    reply: FastifyReply
) {
    const userId = request.user?.sub;
    const replies = await service.getCommentReplies(
        request.params.parentId,
        request.query.limit,
        request.query.cursor,
        userId
    );

    const nextCursor = replies.length > 0 ? (replies[replies.length - 1] as any).createdAt.toISOString() : null;

    return reply.send({
        data: replies,
        meta: { nextCursor }
    });
}

export async function getUserRepliesHandler(
    request: FastifyRequest<{ Querystring: GetUserRepliesQuery }>,
    reply: FastifyReply
) {
    const userId = (request.user as any).sub;
    const { limit, cursor } = request.query;

    const replies = await service.getUserReplies(
        userId,
        limit,
        cursor,
        userId
    );

    const nextCursor = replies.length > 0 ? (replies[replies.length - 1] as any).createdAt.toISOString() : null;

    return reply.send({
        data: replies,
        meta: {
            nextCursor,
            hasNext: replies.length === limit
        }
    });
}

export async function getUserLikedPostsHandler(
    request: FastifyRequest<{ Querystring: GetUserRepliesQuery }>,
    reply: FastifyReply
) {
    const userId = (request.user as any).sub;
    const { limit, cursor } = request.query;

    const posts = await service.getUserLikedPosts(userId, limit, cursor);

    const nextCursor = posts.length > 0 ? (posts[posts.length - 1] as any).likedAt.toISOString() : null;

    return reply.send({
        data: posts,
        meta: {
            nextCursor,
            hasNext: posts.length === limit
        }
    });
}

export async function createRepostHandler(
    request: FastifyRequest<{ Body: RepostInput }>,
    reply: FastifyReply
) {
    const userId = request.user!.sub;
    const { postId, content } = request.body;
    const result = await service.createRepost(userId, postId, content);
    return reply.status(201).send(result);
}
