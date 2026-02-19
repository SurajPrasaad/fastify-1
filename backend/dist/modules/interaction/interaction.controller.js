import { InteractionService } from "./interaction.service.js";
const service = new InteractionService();
export async function toggleLikeHandler(request, reply) {
    const userId = request.session.userId;
    const result = await service.toggleLike(userId, request.body.resourceId, request.body.resourceType);
    return reply.send(result);
}
export async function toggleBookmarkHandler(request, reply) {
    const userId = request.session.userId;
    const result = await service.toggleBookmark(userId, request.params.postId);
    return reply.send(result);
}
export async function createCommentHandler(request, reply) {
    const userId = request.session.userId;
    const comment = await service.addComment(userId, request.body);
    return reply.status(201).send(comment);
}
export async function getCommentsHandler(request, reply) {
    const comments = await service.getPostComments(request.params.postId, request.query.limit, request.query.cursor);
    const nextCursor = comments.length > 0 ? comments[comments.length - 1]?.createdAt.toISOString() : null;
    return reply.send({
        data: comments,
        meta: { nextCursor }
    });
}
export async function getRepliesHandler(request, reply) {
    const replies = await service.getCommentReplies(request.params.parentId, request.query.limit, request.query.cursor);
    const nextCursor = replies.length > 0 ? replies[replies.length - 1]?.createdAt.toISOString() : null;
    return reply.send({
        data: replies,
        meta: { nextCursor }
    });
}
//# sourceMappingURL=interaction.controller.js.map