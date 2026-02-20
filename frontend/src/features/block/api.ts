import { api } from "@/lib/api-client";
import { BlockResponse, BlockStatus, BlockedUser } from "./types";

export const BlockApi = {
    blockUser: (userId: string) =>
        api.post<BlockResponse>(`/blocks/${userId}`),

    unblockUser: (userId: string) =>
        api.delete<BlockResponse>(`/blocks/${userId}`),

    getBlockStatus: (userId: string) =>
        api.get<BlockStatus>(`/blocks/${userId}/status`),

    getBlockedUsers: () =>
        api.get<BlockedUser[]>("/blocks"),
};
