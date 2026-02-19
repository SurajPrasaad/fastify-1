import type { FastifyReply, FastifyRequest } from "fastify";
import type { ToggleLikeInput, CreateCommentInput, GetCommentsQuery, GetRepliesQuery } from "./interaction.dto.js";
export declare function toggleLikeHandler(request: FastifyRequest<{
    Body: ToggleLikeInput;
}>, reply: FastifyReply): Promise<never>;
export declare function toggleBookmarkHandler(request: FastifyRequest<{
    Params: {
        postId: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function createCommentHandler(request: FastifyRequest<{
    Body: CreateCommentInput;
}>, reply: FastifyReply): Promise<never>;
export declare function getCommentsHandler(request: FastifyRequest<{
    Params: {
        postId: string;
    };
    Querystring: GetCommentsQuery;
}>, reply: FastifyReply): Promise<never>;
export declare function getRepliesHandler(request: FastifyRequest<{
    Params: {
        parentId: string;
    };
    Querystring: GetRepliesQuery;
}>, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=interaction.controller.d.ts.map