/**
 * Call API Client — REST endpoints for call-related operations
 */

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

export interface TurnCredentials {
    urls: string[];
    username: string;
    credential: string;
    ttl: number;
}

export interface TurnLoadReport {
    regions: Record<string, number>;
}

export interface CallStateResponse {
    callId: string;
    state: string;
    callType: "AUDIO" | "VIDEO";
    mediaMode: "AUDIO_ONLY" | "AUDIO_VIDEO";
    callerId: string;
    receiverId: string;
    createdAt: number;
    connectedAt?: number;
    upgradeRequestedBy?: string;
}

export interface QualityAnalysis {
    bandwidthTier: string;
    estimatedBandwidth: number;
    opus: {
        mode: string;
        bitrate: number;
        packetTime: number;
        fec: boolean;
        dtx: boolean;
    };
    video: {
        resolution: string;
        framerate: number;
        bitrate: number;
    } | null;
    shouldFallbackToAudio: boolean;
    packetLossStrategy: string;
}

export const callApi = {
    /** Get call history for authenticated user */
    getHistory: async (): Promise<CallLog[]> => {
        return api.get<CallLog[]>("/call/history");
    },

    /** Delete a call log entry */
    deleteLog: async (id: string): Promise<void> => {
        await api.delete(`/call/history/${id}`);
    },

    /** Get TURN credentials (optionally optimized for a specific call) */
    getTurnCredentials: async (callId?: string): Promise<{ success: boolean; credentials: TurnCredentials }> => {
        return api.post("/call/turn-credentials", callId ? { callId } : {});
    },

    /** Get current call state */
    getCallState: async (callId: string): Promise<CallStateResponse> => {
        return api.get<CallStateResponse>(`/call/state/${callId}`);
    },

    /** Get user's active call */
    getActiveCall: async (): Promise<{ activeCall: any | null }> => {
        return api.get("/call/active");
    },

    /** Check if a user is online */
    checkPresence: async (userId: string): Promise<{ userId: string; online: boolean }> => {
        return api.get(`/call/presence/${userId}`);
    },

    /** Get TURN load across all regions */
    getTurnLoad: async (): Promise<TurnLoadReport> => {
        return api.get<TurnLoadReport>("/call/turn-load");
    },

    /** Analyze call quality and get codec recommendations */
    analyzeQuality: async (report: any): Promise<QualityAnalysis> => {
        return api.post<QualityAnalysis>("/call/quality/analyze", report);
    },
};
