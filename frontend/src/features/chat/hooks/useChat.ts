
import { useEffect, useCallback, useMemo } from 'react';
import { useChatStore } from '../store/chat-store';
import { socketManager } from '../sockets/socket-manager';
import { useAuth } from '@/features/auth/components/AuthProvider';

export const useChat = (roomId?: string) => {
    const { user } = useAuth();
    const store = useChatStore();

    useEffect(() => {
        if (roomId) {
            store.setActiveRoom(roomId);
            store.loadHistory(roomId);
            socketManager.joinRoom(roomId);
        }
    }, [roomId]);

    const messages = useMemo(() => {
        return roomId ? (store.messages[roomId] || []) : [];
    }, [roomId, store.messages]);

    const activeConversation = useMemo(() => {
        return roomId ? store.conversations[roomId] : null;
    }, [roomId, store.conversations]);

    const sendMessage = useCallback(async (content: string, type?: any, mediaUrl?: string) => {
        if (!roomId) return;
        await store.sendMessage(roomId, content, type, mediaUrl);
    }, [roomId, store.sendMessage]);

    const sendTyping = useCallback(() => {
        if (roomId) socketManager.sendTyping(roomId);
    }, [roomId]);

    const stopTyping = useCallback(() => {
        if (roomId) socketManager.stopTyping(roomId);
    }, [roomId]);

    const loadHistory = useCallback((before?: string) => {
        if (roomId) store.loadHistory(roomId, before);
    }, [roomId, store]);

    return {
        messages,
        activeConversation,
        sendMessage,
        sendTyping,
        stopTyping,
        loadHistory,
        isLoading: store.isLoading,
        error: store.error,
        presenceMap: store.presenceMap,
        hasMore: !!roomId && !!store.hasMoreByConversation[roomId]
    };
};
