import { BlockRepository } from "./block.repository.js";
export declare class BlockService {
    private blockRepository;
    constructor(blockRepository: BlockRepository);
    blockUser(blockerId: string, blockedId: string): Promise<{
        success: boolean;
    }>;
    unblockUser(blockerId: string, blockedId: string): Promise<{
        success: boolean;
    }>;
    isBlocked(blockerId: string, blockedId: string): Promise<boolean>;
}
//# sourceMappingURL=block.service.d.ts.map