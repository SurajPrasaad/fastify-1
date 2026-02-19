import type { FastifyReply, FastifyRequest } from "fastify";
import { trackEventSchema } from "./recommendation.schema.js";
import { z } from "zod";
export declare function trackInteractionHandler(request: FastifyRequest<{
    Body: z.infer<typeof trackEventSchema>;
}>, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=analytics.controller.d.ts.map