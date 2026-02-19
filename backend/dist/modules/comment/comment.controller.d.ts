import type { FastifyReply, FastifyRequest } from "fastify";
import { CommentService } from "./comment.service.js";
import type { CreateCommentDto } from "./comment.dto.js";
export declare class CommentController {
    private commentService;
    constructor(commentService: CommentService);
    createCommentHandler: (request: FastifyRequest<{
        Body: CreateCommentDto;
        Params: {
            postId: string;
        };
    }>, reply: FastifyReply) => Promise<never>;
    getCommentsHandler: (request: FastifyRequest<{
        Querystring: {
            limit?: number;
            cursor?: string;
            parentId?: string;
        };
        Params: {
            postId: string;
        };
    }>, reply: FastifyReply) => Promise<never>;
}
//# sourceMappingURL=comment.controller.d.ts.map