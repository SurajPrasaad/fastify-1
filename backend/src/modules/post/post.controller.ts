
import type { FastifyReply, FastifyRequest } from "fastify";
import type { CreatePostInput, UpdatePostInput } from "./post.schema.js";
import { getPostsQuerySchema } from "./post.schema.js";
import { PostService } from "./post.service.js";
import { PostRepository } from "./post.repository.js";
import { z } from "zod";

const postRepository = new PostRepository();
const postService = new PostService(postRepository); // Dependency Injection

export async function createPostHandler(
    request: FastifyRequest<{ Body: CreatePostInput, Querystring: { draft?: string } }>,
    reply: FastifyReply
) {
    const userId = request.user!.sub; // Using JWT sub
    const isDraft = request.query.draft === 'true';
    const post = await postService.createPost(userId, { ...request.body, isDraft });
    return reply.code(201).send(post);
}

export async function publishDraftHandler(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const userId = request.user!.sub;
    const published = await postService.publishDraft(id, userId);
    return reply.send(published);
}

export async function getPostHandler(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const userId = request.user?.sub;
    const post = await postService.getPost(id, userId);
    return reply.send(post);
}

export async function getPostsHandler(
    request: FastifyRequest<{ Querystring: z.infer<typeof getPostsQuerySchema> }>,
    reply: FastifyReply
) {
    const { limit, cursor, authorUsername, authorId } = request.query;
    const userId = request.user?.sub;

    const posts = await postService.getFeed(limit, cursor, userId, {
        authorUsername,
        authorId,
    });

    return reply.send(posts);
}

export async function updatePostHandler(
    request: FastifyRequest<{ Params: { id: string }, Body: UpdatePostInput }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const userId = request.user!.sub;
    const updated = await postService.updatePost(id, userId, request.body);
    return reply.send(updated);
}

export async function archivePostHandler(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const userId = request.user!.sub;
    const archived = await postService.archivePost(id, userId);
    return reply.send(archived);
}

export async function deletePostHandler(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const userId = request.user!.sub;
    await postService.deletePost(id, userId);
    return reply.code(204).send();
}

export async function getUserPostsHandler(
    request: FastifyRequest<{ Querystring: { limit?: number; cursor?: string } }>,
    reply: FastifyReply
) {
    const userId = request.user!.sub;
    const { limit, cursor } = request.query;

    // Fetch posts authored by the current user
    const posts = await postService.getFeed(
        limit || 20,
        cursor,
        userId,
        { authorId: userId }
    );

    const nextCursor = posts.length > 0 ? (posts[posts.length - 1] as any).publishedAt?.toISOString() : null;

    return reply.send({
        data: posts,
        meta: {
            nextCursor,
            hasNext: posts.length === (limit || 20)
        }
    });
}

export async function getProfilePostsHandler(
    request: FastifyRequest<{ Params: { username: string }, Querystring: { limit?: number; cursor?: string } }>,
    reply: FastifyReply
) {
    const { username } = request.params;
    const { limit, cursor } = request.query;
    const currentUserId = request.user?.sub;

    const posts = await postService.getFeed(
        limit || 20,
        cursor,
        currentUserId,
        { authorUsername: username }
    );

    const nextCursor = posts.length > 0 ? (posts[posts.length - 1] as any).publishedAt?.toISOString() : null;

    return reply.send({
        data: posts,
        meta: {
            nextCursor,
            hasNext: posts.length === (limit || 20)
        }
    });
}

export async function votePollHandler(

    request: FastifyRequest<{ Params: { id: string }, Body: { optionId: string } }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const { optionId } = request.body;
    const userId = request.user!.sub;

    await postService.votePoll(userId, id, optionId);
    return reply.send({ message: "Vote recorded" });
}


