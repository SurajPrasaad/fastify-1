
import { useEffect, useState, useCallback } from 'react';
import { useChatStore } from '../store/chat.store';
import { ChatService } from '../services/chat.service';


export const useMessages = (conversationId: string | null) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const messages = useChatStore((state) => conversationId ? state.messages[conversationId] || [] : []);
    const hasMore = useChatStore((state) => conversationId ? state.hasMoreByConversation[conversationId] ?? true : false);
    const cursor = useChatStore((state) => conversationId ? state.cursorByConversation[conversationId] : null);

    const { setMessages, prependMessages } = useChatStore();

    const loadInitialMessages = useCallback(async () => {
        if (!conversationId) return;

        setIsLoading(true);
        try {
            const { data, hasMore: more, nextCursor } = await ChatService.fetchChatHistory(conversationId, 50);
            setMessages(conversationId, data, more, nextCursor);
        } catch (error) {
            console.error('Failed to load messages', error);
        } finally {
            setIsLoading(false);
        }
    }, [conversationId, setMessages]);

    const loadMoreMessages = useCallback(async () => {
        if (!conversationId || !hasMore || isFetchingMore || !cursor) return;

        setIsFetchingMore(true);
        try {
            const { data, hasMore: more, nextCursor } = await ChatService.fetchChatHistory(conversationId, 50, cursor);
            prependMessages(conversationId, data, more, nextCursor);
        } catch (error) {
            console.error('Failed to load more messages', error);
        } finally {
            setIsFetchingMore(false);
        }
    }, [conversationId, hasMore, isFetchingMore, cursor, prependMessages]);

    useEffect(() => {
        if (conversationId && messages.length === 0) {
            loadInitialMessages();
        }
    }, [conversationId, loadInitialMessages, messages.length]);

    return {
        messages,
        isLoading,
        isFetchingMore,
        hasMore,
        loadMoreMessages
    };
};
