import { api } from "@/lib/api-client";
import {
    ChatRoom,
    ChatMessage,
    CreateRoomDto,
    SearchMessagesParams,
    UserPresence
} from "@/types/chat";

export const ChatService = {
    /**
     * Create a new direct or group chat room
     */
    createRoom: async (data: CreateRoomDto): Promise<ChatRoom> => {
        return api.post<ChatRoom>("/chat/rooms", data);
    },

    /**
     * Get list of conversations for the current user
     */
    getConversations: async (limit = 20, offset = 0): Promise<ChatRoom[]> => {
        return api.get<ChatRoom[]>(`/chat/rooms?limit=${limit}&offset=${offset}`);
    },

    /**
     * Get message history for a specific room
     */
    getHistory: async (roomId: string, limit = 50, before?: string): Promise<ChatMessage[]> => {
        const query = new URLSearchParams({
            limit: limit.toString(),
            ...(before && { before })
        });
        return api.get<ChatMessage[]>(`/chat/rooms/${roomId}/messages?${query.toString()}`);
    },

    /**
     * Search messages across all conversations
     */
    searchMessages: async (params: SearchMessagesParams): Promise<ChatMessage[]> => {
        const query = new URLSearchParams({
            q: params.q,
            limit: (params.limit || 20).toString(),
            offset: (params.offset || 0).toString()
        });
        return api.get<ChatMessage[]>(`/chat/messages/search?${query.toString()}`);
    },

    /**
     * Get presence status of a user
     */
    getUserPresence: async (userId: string): Promise<UserPresence> => {
        return api.get<UserPresence>(`/chat/presence/${userId}`);
    },

    /**
     * Mark all messages in a room as read
     */
    markAsRead: async (roomId: string): Promise<{ success: boolean }> => {
        return api.post<{ success: boolean }>(`/chat/rooms/${roomId}/read`);
    },
};
