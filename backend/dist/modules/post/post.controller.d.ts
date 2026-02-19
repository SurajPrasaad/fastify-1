import type { FastifyReply, FastifyRequest } from "fastify";
import type { CreatePostInput, UpdatePostInput, getPostsQuerySchema } from "./post.schema.js";
import { z } from "zod";
export declare function createPostHandler(request: FastifyRequest<{
    Body: CreatePostInput;
    Querystring: {
        draft?: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function publishDraftHandler(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function getPostHandler(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function getPostsHandler(request: FastifyRequest<{
    Querystring: z.infer<typeof getPostsQuerySchema>;
}>, reply: FastifyReply): Promise<never>;
export declare function updatePostHandler(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: UpdatePostInput;
}>, reply: FastifyReply): Promise<never>;
export declare function archivePostHandler(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function deletePostHandler(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function getUploadSignatureHandler(request: FastifyRequest, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=post.controller.d.ts.map