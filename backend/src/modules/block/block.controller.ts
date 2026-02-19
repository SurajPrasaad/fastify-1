import type { FastifyReply, FastifyRequest } from "fastify";
import type { BlockService } from "./block.service.js";
import type { BlockParamsDto } from "./block.dto.js";

export class BlockController {
    constructor(private blockService: BlockService) { }

    blockUserHandler = async (
        request: FastifyRequest<{ Params: BlockParamsDto }>,
        reply: FastifyReply
    ) => {
        const { id: blockedId } = request.params;
        const blockerId = request.user!.sub;
        return this.blockService.blockUser(blockerId, blockedId);
    };

    unblockUserHandler = async (
        request: FastifyRequest<{ Params: BlockParamsDto }>,
        reply: FastifyReply
    ) => {
        const { id: blockedId } = request.params;
        const blockerId = request.user!.sub;
        return this.blockService.unblockUser(blockerId, blockedId);
    };
}
