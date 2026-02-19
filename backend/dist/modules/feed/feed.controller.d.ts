import type { FastifyReply, FastifyRequest } from "fastify";
import type { getFeedSchema } from "./feed.schema.js";
import type { z } from "zod";
export declare function getHomeFeedHandler(request: FastifyRequest<{
    Querystring: z.infer<typeof getFeedSchema>;
}>, reply: FastifyReply): Promise<never>;
export declare function getExploreFeedHandler(request: FastifyRequest, reply: FastifyReply): Promise<never>;
export declare function getHashtagFeedHandler(request: FastifyRequest, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=feed.controller.d.ts.map