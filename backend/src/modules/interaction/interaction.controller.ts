
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

import { UserRepository } from "../user/user.repository.js";
import { AppError } from "../../utils/AppError.js";

const service = new InteractionService();
const userRepository = new UserRepository();

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
        limit || 20,
        cursor,
        userId
    );

    const nextCursor = replies.length > 0 ? (replies[replies.length - 1] as any).createdAt.toISOString() : null;

    return reply.send({
        data: replies,
        meta: {
            nextCursor,
            hasNext: replies.length === (limit || 20)
        }
    });
}

export async function getProfileRepliesHandler(
    request: FastifyRequest<{ Params: { username: string }, Querystring: GetUserRepliesQuery }>,
    reply: FastifyReply
) {
    const { username } = request.params;
    const { limit, cursor } = request.query;
    const currentUserId = request.user?.sub;

    const user = await userRepository.findByUsername(username);
    if (!user) {
        throw new AppError("User not found", 404);
    }

    const replies = await service.getUserReplies(
        user.id,
        limit || 20,
        cursor,
        currentUserId
    );

    const nextCursor = replies.length > 0 ? (replies[replies.length - 1] as any).createdAt.toISOString() : null;

    return reply.send({
        data: replies,
        meta: {
            nextCursor,
            hasNext: replies.length === (limit || 20)
        }
    });
}

export async function getUserLikedPostsHandler(
    request: FastifyRequest<{ Querystring: GetUserRepliesQuery }>,
    reply: FastifyReply
) {
    const userId = (request.user as any).sub;
    const { limit, cursor } = request.query;

    const posts = await service.getUserLikedPosts(userId, limit || 20, cursor);

    const nextCursor = posts.length > 0 ? (posts[posts.length - 1] as any).likedAt.toISOString() : null;

    return reply.send({
        data: posts,
        meta: {
            nextCursor,
            hasNext: posts.length === (limit || 20)
        }
    });
}

export async function getProfileLikedPostsHandler(
    request: FastifyRequest<{ Params: { username: string }, Querystring: GetUserRepliesQuery }>,
    reply: FastifyReply
) {
    const { username } = request.params;
    const { limit, cursor } = request.query;

    const user = await userRepository.findByUsername(username);
    if (!user) {
        throw new AppError("User not found", 404);
    }

    const posts = await service.getUserLikedPosts(user.id, limit || 20, cursor);

    const nextCursor = posts.length > 0 ? (posts[posts.length - 1] as any).likedAt.toISOString() : null;

    return reply.send({
        data: posts,
        meta: {
            nextCursor,
            hasNext: posts.length === (limit || 20)
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

export async function getUserBookmarksHandler(
    request: FastifyRequest<{ Querystring: GetUserRepliesQuery }>,
    reply: FastifyReply
) {
    const userId = (request.user as any).sub;
    const { limit, cursor } = request.query;

    const posts = await service.getUserBookmarks(userId, limit, cursor);

    const nextCursor = posts.length > 0 ? (posts[posts.length - 1] as any).bookmarkedAt.toISOString() : null;

    return reply.send({
        data: posts,
        meta: {
            nextCursor,
            hasNext: posts.length === limit
        }
    });
}
