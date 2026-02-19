import { PostService } from "./post.service.js";
import { PostRepository } from "./post.repository.js";
import { z } from "zod";
const postRepository = new PostRepository();
const postService = new PostService(postRepository); // Dependency Injection
export async function createPostHandler(request, reply) {
    const userId = request.user.sub; // Using JWT sub
    const isDraft = request.query.draft === 'true';
    const post = await postService.createPost(userId, { ...request.body, isDraft });
    return reply.code(201).send(post);
}
export async function publishDraftHandler(request, reply) {
    const { id } = request.params;
    const userId = request.user.sub;
    const published = await postService.publishDraft(id, userId);
    return reply.send(published);
}
export async function getPostHandler(request, reply) {
    const { id } = request.params;
    const userId = request.user?.sub;
    const post = await postService.getPost(id, userId);
    return reply.send(post);
}
export async function getPostsHandler(request, reply) {
    const { limit, cursor } = request.query;
    const posts = await postService.getFeed(limit, cursor);
    return reply.send(posts);
}
export async function updatePostHandler(request, reply) {
    const { id } = request.params;
    const userId = request.user.sub;
    const updated = await postService.updatePost(id, userId, request.body);
    return reply.send(updated);
}
export async function archivePostHandler(request, reply) {
    const { id } = request.params;
    const userId = request.user.sub;
    const archived = await postService.archivePost(id, userId);
    return reply.send(archived);
}
export async function deletePostHandler(request, reply) {
    const { id } = request.params;
    const userId = request.user.sub;
    await postService.deletePost(id, userId);
    return reply.code(204).send();
}
export async function getUploadSignatureHandler(request, reply) {
    const signature = await postService.getUploadSignature();
    return reply.send(signature);
}
//# sourceMappingURL=post.controller.js.map