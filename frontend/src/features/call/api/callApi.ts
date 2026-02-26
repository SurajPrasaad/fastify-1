import { api } from "@/lib/api-client";

export interface CallLog {
    id: string;
    callerId: string;
    receiverId: string;
    callType: "AUDIO" | "VIDEO";
    status: "COMPLETED" | "MISSED" | "REJECTED" | "TIMEOUT" | "FAILED";
    durationSeconds: number;
    startedAt: string;
    endedAt?: string;
    caller: {
        id: string;
        name: string;
        username: string;
        avatarUrl: string;
    };
    receiver: {
        id: string;
        name: string;
        username: string;
        avatarUrl: string;
    };
}

export const callApi = {
    getHistory: async (): Promise<CallLog[]> => {
        return api.get<CallLog[]>("/call/history");
    },
    deleteLog: async (id: string): Promise<void> => {
        await api.delete(`/call/history/${id}`);
    }
};
