
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
    ChatState,
    IMessage,
    IConversation,
    MessageStatus,
    MessageType
} from '../types/chat.types';
import { ChatService } from '../services/chat.service';

interface ChatActions {
    setActiveConversation: (id: string | null) => void;
    setConversations: (conversations: IConversation[]) => void;
    addMessage: (conversationId: string, message: IMessage) => void;
    updateMessage: (conversationId: string, messageId: string, updates: Partial<IMessage>) => void;
    setMessages: (conversationId: string, messages: IMessage[], hasMore: boolean, cursor: string | null) => void;
    prependMessages: (conversationId: string, messages: IMessage[], hasMore: boolean, cursor: string | null) => void;
    setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
    setOnlineStatus: (userId: string, isOnline: boolean) => void;

    // High-level Actions
    sendMessage: (conversationId: string, content: string, replyToId?: string) => Promise<void>;
    markAsRead: (conversationId: string) => void;
}

export const useChatStore = create<ChatState & ChatActions>()(
    devtools((set, get) => ({
        activeConversationId: null,
        conversations: {},
        messages: {},
        cursorByConversation: {},
        hasMoreByConversation: {},
        onlineUsers: new Set(),
        sendingQueue: [],
        unreadCounts: {},

        setActiveConversation: (id) => set({ activeConversationId: id }),

        setConversations: (conversations) => {
            const convMap: Record<string, IConversation> = {};
            const unread: Record<string, number> = {};
            conversations.forEach(c => {
                convMap[c.id] = c;
                unread[c.id] = c.unreadCount;
            });
            set({ conversations: convMap, unreadCounts: unread });
        },

        addMessage: (conversationId, message) => {
            set(state => {
                const existingMessages = state.messages[conversationId] || [];
                // Prevent duplicates
                if (existingMessages.some(m => m.id === message.id || (message.tempId && m.tempId === message.tempId))) {
                    return state;
                }

                const newMessages = [...existingMessages, message];

                // Update last message in conversation
                const conversation = state.conversations[conversationId];
                const updatedConversations = { ...state.conversations };
                if (conversation) {
                    updatedConversations[conversationId] = {
                        ...conversation,
                        lastMessage: message,
                        updatedAt: message.createdAt
                    };
                }

                return {
                    messages: {
                        ...state.messages,
                        [conversationId]: newMessages
                    },
                    conversations: updatedConversations
                };
            });
        },

        updateMessage: (conversationId, messageId, updates) => {
            set(state => ({
                messages: {
                    ...state.messages,
                    [conversationId]: (state.messages[conversationId] || []).map(m =>
                        (m.id === messageId || (m.tempId === messageId)) ? { ...m, ...updates } : m
                    )
                }
            }));
        },

        setMessages: (conversationId, messages, hasMore, cursor) => {
            set(state => ({
                messages: { ...state.messages, [conversationId]: messages },
                hasMoreByConversation: { ...state.hasMoreByConversation, [conversationId]: hasMore },
                cursorByConversation: { ...state.cursorByConversation, [conversationId]: cursor }
            }));
        },

        prependMessages: (conversationId, messages, hasMore, cursor) => {
            set(state => ({
                messages: {
                    ...state.messages,
                    [conversationId]: [...messages, ...(state.messages[conversationId] || [])]
                },
                hasMoreByConversation: { ...state.hasMoreByConversation, [conversationId]: hasMore },
                cursorByConversation: { ...state.cursorByConversation, [conversationId]: cursor }
            }));
        },

        setTyping: (conversationId, userId, isTyping) => {
            set(state => {
                const conv = state.conversations[conversationId];
                if (!conv) return state;

                const typingUsers = new Set(conv.typingUsers);
                if (isTyping) typingUsers.add(userId);
                else typingUsers.delete(userId);

                return {
                    conversations: {
                        ...state.conversations,
                        [conversationId]: { ...conv, typingUsers: Array.from(typingUsers) }
                    }
                };
            });
        },

        setOnlineStatus: (userId, isOnline) => {
            set(state => {
                const newOnline = new Set(state.onlineUsers);
                if (isOnline) newOnline.add(userId);
                else newOnline.delete(userId);
                return { onlineUsers: newOnline };
            });
        },

        sendMessage: async (conversationId, content, replyToId) => {
            const tempId = `temp-${Date.now()}`;
            const currentUser = { id: 'me', name: 'Me', username: 'me' }; // Should come from auth store

            const optimisticMessage: IMessage = {
                id: tempId,
                tempId,
                conversationId,
                senderId: currentUser.id,
                sender: currentUser,
                content,
                type: MessageType.TEXT,
                status: MessageStatus.SENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                ...(replyToId && { replyTo: { id: replyToId, content: '...', senderName: '...', type: MessageType.TEXT } })
            };

            get().addMessage(conversationId, optimisticMessage);

            try {
                const response = await ChatService.sendChatMessage({
                    roomId: conversationId,
                    content,
                    // type and other fields could be added here
                });

                // Swap optimistic with real
                get().updateMessage(conversationId, tempId, {
                    ...response,
                    status: MessageStatus.SENT
                });
            } catch (error) {
                get().updateMessage(conversationId, tempId, { status: MessageStatus.ERROR });
            }
        },

        markAsRead: (conversationId) => {
            set(state => ({
                unreadCounts: { ...state.unreadCounts, [conversationId]: 0 }
            }));
            ChatService.markAsRead(conversationId);
        }
    }))
);
