export declare class BlockRepository {
    blockUser(blockerId: string, blockedId: string): Promise<{
        success: boolean;
    }>;
    unblockUser(blockerId: string, blockedId: string): Promise<{
        success: boolean;
    }>;
    isBlocked(blockerId: string, blockedId: string): Promise<boolean>;
}
//# sourceMappingURL=block.repository.d.ts.map