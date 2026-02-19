
import type { FastifyReply, FastifyRequest } from "fastify";
import { CommentService } from "./comment.service.js";
import type { CreateCommentDto, GetCommentsDto } from "./comment.dto.js";

export class CommentController {
    constructor(private commentService: CommentService) { }

    createCommentHandler = async (
        request: FastifyRequest<{ Body: CreateCommentDto, Params: { postId: string } }>,
        reply: FastifyReply
    ) => {
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

    getCommentsHandler = async (
        request: FastifyRequest<{ Querystring: { limit?: number, cursor?: string, parentId?: string }, Params: { postId: string } }>,
        reply: FastifyReply
    ) => {
        const { postId } = request.params;
        const { limit, cursor, parentId } = request.query;

        const result = await this.commentService.getComments({ postId, limit: limit || 20, cursor, parentId: parentId || undefined });

        return reply.status(200).send(result);
    };
}
