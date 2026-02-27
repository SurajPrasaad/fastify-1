
import { io, Socket } from 'socket.io-client';
import { useChatStore } from '../store/chat-store';
import { IMessage } from '../types';

class SocketManager {
    private socket: Socket | null = null;
    private baseUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    connect(token: string) {
        if (this.socket?.connected) return;

        this.socket = io(this.baseUrl, {
            path: '/chat/socket.io', // fastify-socket.io default path
            query: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        this.setupListeners();
    }

    private setupListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('Connected to Chat Socket');
            this.reconnectAttempts = 0;
            // Join relevant rooms
            const { activeRoomId } = useChatStore.getState();
            if (activeRoomId) this.joinRoom(activeRoomId);
        });

        this.socket.on('event', (event: { type: string; payload: any }) => {
            const { type, payload } = event;
            const chatStore = useChatStore.getState();
            // We use global feed store here for real-time updates
            const { updatePostStats } = (require('../../feed/store/feed.store') as any).useFeedStore.getState();

            switch (type) {
                case 'NEW_MESSAGE':
                    chatStore.addMessage(payload.roomId, payload);
                    chatStore.updateConversation(payload.roomId, { lastMessage: payload });
                    break;
                case 'USER_TYPING':
                    chatStore.setTyping(payload.roomId, payload.userId, true);
                    break;
                case 'USER_STOPPED_TYPING':
                    chatStore.setTyping(payload.roomId, payload.userId, false);
                    break;
                case 'USER_ONLINE':
                    chatStore.setPresence(payload.userId, {
                        userId: payload.userId,
                        status: 'ONLINE' as any,
                        lastSeen: new Date().toISOString()
                    });
                    break;
                case 'USER_OFFLINE':
                    chatStore.setPresence(payload.userId, {
                        userId: payload.userId,
                        status: 'OFFLINE' as any,
                        lastSeen: new Date().toISOString()
                    });
                    break;
                case 'READ_ACK':
                    chatStore.updateMessage(payload.roomId, payload.messageId, { status: 'read' });
                    break;

                // --- Social Engagement Events ---
                case 'STATS_UPDATE':
                    // Real-time update for like counts, etc.
                    updatePostStats(payload.targetId, payload.stats);
                    break;
                case 'NEW_COMMENT':
                    // Trigger refetch or optimistic inject
                    if (payload.targetType === 'POST') {
                        // could use invalidate or store update
                    }
                    break;
                case 'NOTIFICATION':
                    // Handle real-time push notification
                    break;
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.warn('Socket disconnected:', reason);
            if (reason === 'io server disconnect') {
                this.socket?.connect();
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            this.reconnectAttempts++;
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                this.disconnect();
            }
        });
    }

    joinRoom(roomId: string) {
        this.socket?.emit('JOIN_ROOM', { roomId });
    }

    sendTyping(roomId: string) {
        this.socket?.emit('TYPING', { roomId });
    }

    stopTyping(roomId: string) {
        this.socket?.emit('STOP_TYPING', { roomId });
    }

    markAsRead(roomId: string, messageId: string) {
        this.socket?.emit('READ_RECEIPT', { roomId, messageId });
    }

    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
    }
}

export const socketManager = new SocketManager();
