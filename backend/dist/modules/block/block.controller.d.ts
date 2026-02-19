import type { FastifyReply, FastifyRequest } from "fastify";
import type { BlockService } from "./block.service.js";
import type { BlockParamsDto } from "./block.dto.js";
export declare class BlockController {
    private blockService;
    constructor(blockService: BlockService);
    blockUserHandler: (request: FastifyRequest<{
        Params: BlockParamsDto;
    }>, reply: FastifyReply) => Promise<{
        success: boolean;
    }>;
    unblockUserHandler: (request: FastifyRequest<{
        Params: BlockParamsDto;
    }>, reply: FastifyReply) => Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=block.controller.d.ts.map