import type { FastifyReply, FastifyRequest } from "fastify";
import { getFeedSchema } from "./recommendation.schema.js";
import { z } from "zod";
export declare function getForYouFeedHandler(request: FastifyRequest<{
    Querystring: z.infer<typeof getFeedSchema>;
}>, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=recommendation.controller.d.ts.map