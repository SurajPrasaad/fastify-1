import { api } from "./api-client";
import { SpaceRoom, GetActiveRoomsResponse } from "../types/space";

/**
 * Service to interact with the tRPC-based Audio Room / Spaces endpoints
 */
export const SpaceService = {
    async getActiveRooms(limit: number = 20, cursor?: string): Promise<GetActiveRoomsResponse> {
        const input = JSON.stringify({ limit, cursor });
        // tRPC GET query format
        const response = await api.get<any>(`/trpc/rooms.getActiveRooms?input=${encodeURIComponent(input)}`);
        return response.result.data;
    },

    async getRoom(roomId: string): Promise<SpaceRoom> {
        const input = JSON.stringify({ roomId });
        const response = await api.get<any>(`/trpc/rooms.getRoom?input=${encodeURIComponent(input)}`);
        return response.result.data;
    },

    async createRoom(title: string): Promise<SpaceRoom> {
        const response = await api.post<any>(`/trpc/rooms.createRoom`, { title });
        return response.result.data;
    },

    async raiseHand(roomId: string) {
        return api.post(`/trpc/rooms.raiseHand`, { roomId });
    },

    async endRoom(roomId: string) {
        return api.post(`/trpc/rooms.endRoom`, { roomId });
    }
};
