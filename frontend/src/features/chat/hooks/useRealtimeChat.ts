
import { useEffect } from 'react';
import { chatWebSocket } from '../services/websocket.manager';
import { useChatStore } from '../store/chat-store';
import { ChatEvent, MessageStatus } from '../types/chat.types';

export const useRealtimeChat = (token?: string) => {
    const {
        addMessage,
        updateMessage,
        setTyping,
        setOnlineStatus,
        activeConversationId,
        markAsRead
    } = useChatStore();

    useEffect(() => {
        if (!token) return;

        chatWebSocket.connect(token);

        const unsubscribe = chatWebSocket.subscribe((event: ChatEvent) => {
            switch (event.type) {
                case 'NEW_MESSAGE':
                    addMessage(event.payload.conversationId, event.payload);
                    // If message is in active conversation, mark as read automatically
                    if (activeConversationId === event.payload.conversationId) {
                        markAsRead(event.payload.conversationId);
                    }
                    break;

                case 'MESSAGE_UPDATED':
                    updateMessage(event.payload.conversationId!, event.payload.id, event.payload);
                    break;

                case 'MESSAGE_STATUS':
                    updateMessage(event.payload.conversationId, event.payload.messageId, {
                        status: event.payload.status as MessageStatus
                    });
                    break;

                case 'TYPING_STATUS':
                    setTyping(event.payload.conversationId, event.payload.userId, event.payload.isTyping);
                    break;

                case 'USER_PRESENCE':
                    setOnlineStatus(event.payload.userId, event.payload.isOnline);
                    break;

                case 'MESSAGE_REACTION':
                    // Handle reaction logic
                    break;
            }
        });

        return () => {
            unsubscribe();
            chatWebSocket.disconnect();
        };
    }, [token, activeConversationId, addMessage, updateMessage, setTyping, setOnlineStatus, markAsRead]);

    return {
        sendTypingStatus: (conversationId: string, isTyping: boolean) => {
            chatWebSocket.send({
                type: 'TYPING_STATUS',
                payload: { conversationId, isTyping }
            });
        }
    };
};
