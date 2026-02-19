import { CommentService } from "./comment.service.js";
export class CommentController {
    commentService;
    constructor(commentService) {
        this.commentService = commentService;
    }
    createCommentHandler = async (request, reply) => {
        const { postId } = request.params;
        const { content, parentId } = request.body;
        const userId = request.session.userId;
        if (!userId) {
            return reply.status(401).send({
                success: false,
                message: "Unauthorized"
            });
        }
        const comment = await this.commentService.createComment(userId, {
            postId,
            content,
            parentId: parentId || undefined
        });
        return reply.status(201).send(comment);
    };
    getCommentsHandler = async (request, reply) => {
        const { postId } = request.params;
        const { limit, cursor, parentId } = request.query;
        const result = await this.commentService.getComments({ postId, limit: limit || 20, cursor, parentId: parentId || undefined });
        return reply.status(200).send(result);
    };
}
//# sourceMappingURL=comment.controller.js.map