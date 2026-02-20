
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import {
    ChatState,
    IConversation,
    IMessage,
    IUserPresence,
    PresenceStatus
} from '../types';
import { ChatService } from '../services/chat.service';

interface ChatActions {
    setConversations: (conversations: IConversation[]) => void;
    updateConversation: (roomId: string, updates: Partial<IConversation>) => void;
    setActiveRoom: (roomId: string | null) => void;
    addMessage: (roomId: string, message: IMessage, optimistic?: boolean) => void;
    updateMessage: (roomId: string, messageId: string, updates: Partial<IMessage>) => void;
    setMessages: (roomId: string, messages: IMessage[]) => void;
    setPresence: (userId: string, presence: IUserPresence) => void;
    setTyping: (roomId: string, userId: string, isTyping: boolean) => void;

    // Async Actions
    loadConversations: () => Promise<void>;
    loadHistory: (roomId: string, before?: string) => Promise<void>;
    sendMessage: (roomId: string, content: string, type?: any, mediaUrl?: string) => Promise<void>;
}

export const useChatStore = create<ChatState & ChatActions>()(
    devtools(
        subscribeWithSelector((set, get) => ({
            conversations: [],
            activeRoomId: null,
            messagesByRoom: {},
            presenceMap: {},
            isLoading: {
                conversations: false,
                messages: false,
                rooms: false,
            },
            error: null,

            setConversations: (conversations) => set({ conversations }),

            updateConversation: (roomId, updates) => set((state) => ({
                conversations: state.conversations.map(c =>
                    c.id === roomId ? { ...c, ...updates } : c
                )
            })),

            setActiveRoom: (roomId) => set({ activeRoomId: roomId }),

            addMessage: (roomId, message, optimistic = false) => set((state) => {
                const roomMessages = state.messagesByRoom[roomId] || [];
                // Deduplicate by ID
                if (roomMessages.find(m => m.id === message.id)) return state;

                const updatedMessages = [...roomMessages, message];
                return {
                    messagesByRoom: {
                        ...state.messagesByRoom,
                        [roomId]: updatedMessages.sort((a, b) =>
                            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                        )
                    }
                };
            }),

            updateMessage: (roomId, messageId, updates) => set((state) => ({
                messagesByRoom: {
                    ...state.messagesByRoom,
                    [roomId]: (state.messagesByRoom[roomId] || []).map(m =>
                        m.id === messageId ? { ...m, ...updates } : m
                    )
                }
            })),

            setMessages: (roomId, messages) => set((state) => ({
                messagesByRoom: {
                    ...state.messagesByRoom,
                    [roomId]: messages
                }
            })),

            setPresence: (userId, presence) => set((state) => ({
                presenceMap: {
                    ...state.presenceMap,
                    [userId]: presence
                }
            })),

            setTyping: (roomId, userId, isTyping) => set((state) => ({
                conversations: state.conversations.map(c => {
                    if (c.id !== roomId) return c;
                    const typingUsers = new Set(c.typingUsers || []);
                    if (isTyping) typingUsers.add(userId);
                    else typingUsers.delete(userId);
                    return { ...c, typingUsers: Array.from(typingUsers) };
                })
            })),

            // Async implementations
            loadConversations: async () => {
                set((state) => ({ isLoading: { ...state.isLoading, conversations: true } }));
                try {
                    const conversations = await ChatService.fetchConversations();
                    set({ conversations, isLoading: { ...get().isLoading, conversations: false } });
                } catch (error: any) {
                    set({ error: error.message, isLoading: { ...get().isLoading, conversations: false } });
                }
            },

            loadHistory: async (roomId, before) => {
                set((state) => ({ isLoading: { ...state.isLoading, messages: true } }));
                try {
                    const history = await ChatService.fetchChatHistory(roomId, 50, before);
                    const existing = get().messagesByRoom[roomId] || [];
                    const merged = before
                        ? [...history, ...existing] // Pagination
                        : history; // Initial load

                    set((state) => ({
                        messagesByRoom: { ...state.messagesByRoom, [roomId]: merged },
                        isLoading: { ...state.isLoading, messages: false }
                    }));
                } catch (error: any) {
                    set({ error: error.message, isLoading: { ...get().isLoading, messages: false } });
                }
            },

            sendMessage: async (roomId, content, type, mediaUrl) => {
                const tempId = `temp-${Date.now()}`;
                const optimisticMsg: IMessage = {
                    id: tempId,
                    roomId,
                    senderId: 'current-user', // Should be replaced by actual user ID
                    sender: {} as any, // Will be filled by hook
                    content,
                    type: type || 'TEXT',
                    mediaUrl,
                    readBy: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    status: 'sending'
                };

                get().addMessage(roomId, optimisticMsg);

                try {
                    const savedMsg = await ChatService.sendChatMessage({ roomId, content, type, mediaUrl });
                    // Swap optimistic message with real one
                    set((state) => ({
                        messagesByRoom: {
                            ...state.messagesByRoom,
                            [roomId]: state.messagesByRoom[roomId].map(m =>
                                m.id === tempId ? savedMsg : m
                            )
                        }
                    }));
                } catch (error) {
                    get().updateMessage(roomId, tempId, { status: 'error' });
                }
            }
        }))
    )
);
