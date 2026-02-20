
import { api } from "@/lib/api-client";
import {
    IConversation,
    IMessage,
    IUserPresence,
    RoomType,
    MessageType
} from "../types";

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

export const ChatService = {
    /**
     * Fetch list of conversations for the current user
     */
    fetchConversations: async (limit: number = 20, offset: number = 0) => {
        return api.get<IConversation[]>(`/chat/rooms?limit=${limit}&offset=${offset}`);
    },

    /**
     * Fetch message history for a specific room
     */
    fetchChatHistory: async (roomId: string, limit: number = 50, before?: string) => {
        const query = new URLSearchParams({
            limit: limit.toString(),
            ...(before && { before })
        });
        return api.get<IMessage[]>(`/chat/rooms/${roomId}/messages?${query}`);
    },

    /**
     * Create a new chat room (Direct or Group)
     */
    createChatRoom: async (data: CreateRoomDto) => {
        return api.post<IConversation>("/chat/rooms", data);
    },

    /**
     * Send a new message to a room
     */
    sendChatMessage: async (data: SendMessageDto) => {
        const { roomId, ...payload } = data;
        return api.post<IMessage>(`/chat/rooms/${roomId}/messages`, payload);
    },

    /**
     * Mark a message as read
     */
    markMessageAsRead: async (roomId: string, messageId: string) => {
        return api.post<{ success: boolean }>(`/chat/rooms/${roomId}/messages/${messageId}/read`);
    },

    /**
     * Search within messages
     */
    searchChatMessages: async (query: string, limit: number = 20, offset: number = 0) => {
        return api.get<IMessage[]>(`/chat/messages/search?q=${query}&limit=${limit}&offset=${offset}`);
    },

    /**
     * Get presence status of a specific user
     */
    fetchUserPresence: async (userId: string) => {
        return api.get<IUserPresence>(`/chat/presence/${userId}`);
    },

    /**
     * Batch fetch presence for a list of users
     */
    batchFetchPresence: async (userIds: string[]) => {
        return api.post<Record<string, IUserPresence>>("/chat/presence/batch", { userIds });
    }
};
