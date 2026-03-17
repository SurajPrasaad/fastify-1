import { useEffect, useCallback, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth-store';
import { ChatEvent, IMessage } from '../types/chat';
import { useQueryClient } from '@tanstack/react-query';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8080';

export const useChatSocket = (roomId?: string) => {
    const { token, user } = useAuthStore();
    const queryClient = useQueryClient();
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const handleNewMessage = useCallback((message: IMessage) => {
        // Update chat history cache
        queryClient.setQueryData(['chat-history', message.conversationId, user?.id], (old: any) => {
            if (!old) return old;
            return {
                ...old,
                pages: old.pages.map((page: any, index: number) => {
                    if (index === 0) {
                        return {
                            ...page,
                            data: [message, ...page.data]
                        };
                    }
                    return page;
                })
            };
        });

        // Update conversations list
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }, [queryClient, user?.id]);

    useEffect(() => {
        if (!token || !user) return;

        const socket = io(`${SOCKET_URL}/notifications`, {
            path: '/chat/socket.io',
            query: { token },
            transports: ['websocket'],
        });

        socket.on('connect', () => {
            console.log('Chat Socket connected');
            setIsConnected(true);
            if (roomId) {
                socket.emit('room:join', { roomId });
            }
        });

        socket.on('message:new', (message: IMessage) => {
            handleNewMessage(message);
        });

        socket.on('disconnect', () => {
            console.log('Chat Socket disconnected');
            setIsConnected(false);
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [token, user, roomId, handleNewMessage]);

    const sendMessage = useCallback((content: string, type: string = 'TEXT') => {
        if (socketRef.current && isConnected && roomId) {
            socketRef.current.emit('message:send', {
                roomId,
                content,
                type,
            });
        }
    }, [isConnected, roomId]);

    const sendTyping = useCallback((isTyping: boolean) => {
        if (socketRef.current && isConnected && roomId) {
            socketRef.current.emit('typing:status', {
                roomId,
                isTyping,
            });
        }
    }, [isConnected, roomId]);

    return {
        isConnected,
        sendMessage,
        sendTyping,
    };
};
