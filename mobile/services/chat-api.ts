import { api } from "./api-client";
import { IConversation, IMessage, RoomType, MessageType } from "../types/chat";

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
    nextCursor: string | null;
}

export const ChatService = {
    fetchConversations: async (limit: number = 20, cursor?: string): Promise<PaginatedResponse<IConversation>> => {
        const query = new URLSearchParams({ limit: limit.toString() });
        if (cursor) query.set("cursor", cursor);
        const response = await api.get<IConversation[]>(`/chat/rooms?${query.toString()}`);
        return {
            data: response,
            nextCursor: response.length > 0 ? response[response.length - 1].updatedAt : null
        };
    },

    fetchChatHistory: async (roomId: string, limit: number = 50, cursor?: string): Promise<PaginatedResponse<IMessage>> => {
        const query = new URLSearchParams({ limit: limit.toString() });
        if (cursor) query.set("cursor", cursor);
        const response = await api.get<IMessage[]>(`/chat/rooms/${roomId}/messages?${query.toString()}`);
        return {
            data: response,
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
        return api.post<{ success: boolean }>(`/chat/rooms/${roomId}/read`, {});
    }
};
