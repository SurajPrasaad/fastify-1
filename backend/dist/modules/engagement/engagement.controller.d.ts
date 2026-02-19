import type { FastifyReply, FastifyRequest } from "fastify";
import type { EngagementService } from "./engagement.service.js";
import type { ToggleLikeInput, ReactInput, RepostInput } from "./engagement.schema.js";
export declare class EngagementController {
    private service;
    constructor(service: EngagementService);
    toggleLikeHandler: (request: FastifyRequest<{
        Body: ToggleLikeInput;
    }>, reply: FastifyReply) => Promise<never>;
    reactHandler: (request: FastifyRequest<{
        Body: ReactInput;
    }>, reply: FastifyReply) => Promise<never>;
    repostHandler: (request: FastifyRequest<{
        Body: RepostInput;
    }>, reply: FastifyReply) => Promise<never>;
    getStatsHandler: (request: FastifyRequest<{
        Params: {
            targetId: string;
        };
    }>, reply: FastifyReply) => Promise<never>;
}
//# sourceMappingURL=engagement.controller.d.ts.map