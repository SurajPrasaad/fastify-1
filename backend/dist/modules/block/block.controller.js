export class BlockController {
    blockService;
    constructor(blockService) {
        this.blockService = blockService;
    }
    blockUserHandler = async (request, reply) => {
        const { id: blockedId } = request.params;
        const blockerId = request.user.sub;
        return this.blockService.blockUser(blockerId, blockedId);
    };
    unblockUserHandler = async (request, reply) => {
        const { id: blockedId } = request.params;
        const blockerId = request.user.sub;
        return this.blockService.unblockUser(blockerId, blockedId);
    };
}
//# sourceMappingURL=block.controller.js.map