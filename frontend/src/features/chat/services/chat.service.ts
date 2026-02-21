
import { api } from "@/lib/api-client";
import {
    IConversation,
    IMessage,
    IUserPresence,
    RoomType,
    MessageType
} from "../types/chat.types";

export interface CreateRoomDto {
    participants: string[];
    type: RoomType;
    name?: string;
}

export interface SendMessageDto {
    roomId: string;
    content: string;
    type?: MessageType;
    mediaUrl?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    hasMore: boolean;
    nextCursor: string | null;
}

export const ChatService = {
    fetchConversations: async (limit: number = 20, offset: number = 0): Promise<PaginatedResponse<IConversation>> => {
        const response = await api.get<IConversation[]>(`/chat/rooms?limit=${limit}&offset=${offset}`);
        // Mocking metadata since the current API might not return it yet
        return {
            data: response,
            hasMore: response.length === limit,
            nextCursor: response.length > 0 ? response[response.length - 1].updatedAt : null
        };
    },

    fetchChatHistory: async (roomId: string, limit: number = 50, before?: string): Promise<PaginatedResponse<IMessage>> => {
        const query = new URLSearchParams({
            limit: limit.toString(),
            ...(before && { before })
        });
        const response = await api.get<IMessage[]>(`/chat/rooms/${roomId}/messages?${query}`);
        return {
            data: response,
            hasMore: response.length === limit,
            nextCursor: response.length > 0 ? response[response.length - 1].createdAt : null
        };
    },

    createChatRoom: async (data: CreateRoomDto) => {
        return api.post<IConversation>("/chat/rooms", data);
    },

    sendChatMessage: async (data: SendMessageDto) => {
        const { roomId, ...payload } = data;
        return api.post<IMessage>(`/chat/rooms/${roomId}/messages`, payload);
    },

    markAsRead: async (roomId: string) => {
        return api.post<{ success: boolean }>(`/chat/rooms/${roomId}/read`);
    },

    fetchUserPresence: async (userId: string) => {
        return api.get<IUserPresence>(`/chat/presence/${userId}`);
    },

    batchFetchPresence: async (userIds: string[]): Promise<Record<string, IUserPresence>> => {
        return api.get<Record<string, IUserPresence>>(`/chat/presence/batch?ids=${userIds.join(',')}`);
    }
};
