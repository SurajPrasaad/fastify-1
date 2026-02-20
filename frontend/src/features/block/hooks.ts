import { useBlockStore } from "./store";
import { useQuery } from "@tanstack/react-query";
import { BlockApi } from "./api";
import { toast } from "sonner";
import { useCallback } from "react";

export const useBlock = (userId?: string) => {
    const store = useBlockStore();

    // Query for detailed status (optional, used on profile pages)
    const { data: status, refetch: refetchStatus } = useQuery({
        queryKey: ["block-status", userId],
        queryFn: () => BlockApi.getBlockStatus(userId!),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const handleBlock = useCallback(async () => {
        if (!userId) return;
        try {
            await store.blockUser(userId);
            toast.success("User blocked");
            refetchStatus();
        } catch (error: any) {
            toast.error(error.message || "Failed to block user");
        }
    }, [userId, store, refetchStatus]);

    const handleUnblock = useCallback(async (overrideId?: string) => {
        const targetId = overrideId || userId;
        if (!targetId) return;
        try {
            await store.unblockUser(targetId);
            toast.success("User unblocked");
            if (userId === targetId) refetchStatus();
        } catch (error: any) {
            toast.error(error.message || "Failed to unblock user");
        }
    }, [userId, store, refetchStatus]);

    return {
        isBlocked: userId ? store.isBlocked(userId) : false,
        isBlockedBy: status?.isBlockedBy || false,
        isLoading: store.isLoading,
        block: handleBlock,
        unblock: handleUnblock,
        status,
        fetchBlockedUsers: store.fetchBlockedUsers,
    };
};
