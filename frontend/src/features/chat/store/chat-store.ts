
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
    ChatState,
    ChatActions,
    IMessage,
    IConversation,
    MessageStatus,
    MessageType,
    IUserPresence
} from '../types/chat.types';
import { ChatService } from '../services/chat.service';

export const useChatStore = create<ChatState & ChatActions>()(
    devtools((set, get) => ({
        activeRoomId: null,
        conversations: {},
        messages: {},
        cursorByConversation: {},
        hasMoreByConversation: {},
        onlineUsers: new Set(),
        sendingQueue: [],
        unreadCounts: {},
        isLoading: false,
        error: null,
        presenceMap: {},

        setActiveRoom: (id) => set({ activeRoomId: id }),

        setConversations: (conversations) => {
            const convMap: Record<string, IConversation> = {};
            const unread: Record<string, number> = {};
            conversations.forEach(c => {
                const id = c.id || c._id || '';
                if (id) {
                    convMap[id] = { ...c, id };
                    unread[id] = c.unreadCount;
                }
            });
            set({ conversations: convMap, unreadCounts: unread });
        },

        updateConversation: (id, updates) => {
            set(state => {
                const conv = state.conversations[id];
                if (!conv) return state;
                return {
                    conversations: {
                        ...state.conversations,
                        [id]: { ...conv, ...updates }
                    }
                };
            });
        },

        addMessage: (conversationId, message) => {
            set(state => {
                // Normalize message - backend might use _id or id, roomId or conversationId
                const msgId = message.id || message._id;
                const convId = conversationId || message.conversationId || message.roomId;

                if (!convId) return state;

                const normalizedMessage = {
                    ...message,
                    id: msgId as string,
                    conversationId: convId as string
                };

                const existingMessages = state.messages[convId] || [];

                // Prevent duplicates - only if we have a valid ID or tempId
                const isDuplicate = existingMessages.some(m =>
                    (msgId && m.id === msgId) ||
                    (message.tempId && m.tempId === message.tempId)
                );

                if (isDuplicate) {
                    // Update the status and real ID if it was optimistic
                    return {
                        messages: {
                            ...state.messages,
                            [convId]: existingMessages.map(m =>
                                (msgId && m.id === msgId) || (message.tempId && m.tempId === message.tempId)
                                    ? { ...m, ...normalizedMessage, status: MessageStatus.SENT }
                                    : m
                            )
                        }
                    };
                }

                const newMessages = [...existingMessages, normalizedMessage];

                // Update last message in conversation
                const conversation = state.conversations[convId];
                const updatedConversations = { ...state.conversations };
                const updatedUnread = { ...state.unreadCounts };

                if (conversation) {
                    updatedConversations[convId] = {
                        ...conversation,
                        lastMessage: normalizedMessage,
                        updatedAt: normalizedMessage.createdAt
                    };

                    // Increment unread count if it's not the active conversation
                    if (state.activeRoomId !== convId && normalizedMessage.senderId !== 'me') {
                        updatedUnread[convId] = (updatedUnread[convId] || 0) + 1;
                        updatedConversations[convId].unreadCount = (updatedConversations[convId].unreadCount || 0) + 1;
                    }
                }

                return {
                    messages: {
                        ...state.messages,
                        [convId]: newMessages
                    },
                    conversations: updatedConversations,
                    unreadCounts: updatedUnread
                };
            });
        },

        updateMessage: (conversationId, messageId, updates) => {
            set(state => ({
                messages: {
                    ...state.messages,
                    [conversationId]: (state.messages[conversationId] || []).map(m =>
                        (m.id === messageId || m._id === messageId || m.tempId === messageId) ? { ...m, ...updates } : m
                    )
                }
            }));
        },

        setMessages: (conversationId, messages, hasMore, cursor) => {
            const normalized = messages.map(m => ({
                ...m,
                id: m.id || m._id || '',
                conversationId: m.conversationId || m.roomId || conversationId
            }));
            set(state => ({
                messages: { ...state.messages, [conversationId]: normalized },
                hasMoreByConversation: { ...state.hasMoreByConversation, [conversationId]: hasMore },
                cursorByConversation: { ...state.cursorByConversation, [conversationId]: cursor }
            }));
        },

        prependMessages: (conversationId, messages, hasMore, cursor) => {
            const normalized = messages.map(m => ({
                ...m,
                id: m.id || m._id || '',
                conversationId: m.conversationId || m.roomId || conversationId
            }));
            set(state => ({
                messages: {
                    ...state.messages,
                    [conversationId]: [...normalized, ...(state.messages[conversationId] || [])]
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

        setPresence: (userId, presence) => {
            set(state => ({
                presenceMap: {
                    ...state.presenceMap,
                    [userId]: presence
                },
                onlineUsers: presence.status === 'ONLINE' ?
                    new Set(state.onlineUsers).add(userId) :
                    (() => {
                        const next = new Set(state.onlineUsers);
                        next.delete(userId);
                        return next;
                    })()
            }));
        },

        setOnlineStatus: (userId, isOnline) => {
            set(state => {
                const newOnline = new Set(state.onlineUsers);
                if (isOnline) newOnline.add(userId);
                else newOnline.delete(userId);
                return { onlineUsers: newOnline };
            });
        },

        loadHistory: async (roomId, before) => {
            set({ isLoading: true, error: null });
            try {
                const response = await ChatService.fetchChatHistory(roomId, 50, before);
                if (before) {
                    get().prependMessages(roomId, response.data, response.hasMore, response.nextCursor);
                } else {
                    get().setMessages(roomId, response.data, response.hasMore, response.nextCursor);
                }
            } catch (error: any) {
                set({ error: error.message || 'Failed to load chat history' });
            } finally {
                set({ isLoading: false });
            }
        },

        sendMessage: async (conversationId, content, type = MessageType.TEXT, mediaUrl) => {
            const tempId = `temp-${Date.now()}`;
            const currentUser = { id: 'me', name: 'Me', username: 'me' }; // Should come from auth store

            const optimisticMessage: IMessage = {
                id: tempId,
                tempId,
                conversationId,
                senderId: currentUser.id,
                sender: currentUser,
                content,
                type: type || MessageType.TEXT,
                status: MessageStatus.SENDING,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            get().addMessage(conversationId, optimisticMessage);

            try {
                const response = await ChatService.sendChatMessage({
                    roomId: conversationId,
                    content,
                    type,
                    mediaUrl
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
            set(state => {
                const updatedConversations = { ...state.conversations };
                if (updatedConversations[conversationId]) {
                    updatedConversations[conversationId] = { ...updatedConversations[conversationId], unreadCount: 0 };
                }
                return {
                    unreadCounts: { ...state.unreadCounts, [conversationId]: 0 },
                    conversations: updatedConversations
                };
            });
            ChatService.markAsRead(conversationId);
        },

        incrementUnreadCount: (conversationId) => {
            set(state => {
                const updatedUnread = { ...state.unreadCounts };
                updatedUnread[conversationId] = (updatedUnread[conversationId] || 0) + 1;

                const updatedConversations = { ...state.conversations };
                if (updatedConversations[conversationId]) {
                    updatedConversations[conversationId] = {
                        ...updatedConversations[conversationId],
                        unreadCount: (updatedConversations[conversationId].unreadCount || 0) + 1
                    };
                }

                return { unreadCounts: updatedUnread, conversations: updatedConversations };
            });
        }
    }))
);
