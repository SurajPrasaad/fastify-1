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

    getBlockedUsersHandler = async (
        request: FastifyRequest,
        reply: FastifyReply
    ) => {
        const userId = request.user!.sub;
        return this.blockService.getBlockedUsers(userId);
    };

    getBlockStatusHandler = async (
        request: FastifyRequest<{ Params: BlockParamsDto }>,
        reply: FastifyReply
    ) => {
        const { id: otherUserId } = request.params;
        const userId = request.user!.sub;
        return this.blockService.getBlockStatus(userId, otherUserId);
    };
}
