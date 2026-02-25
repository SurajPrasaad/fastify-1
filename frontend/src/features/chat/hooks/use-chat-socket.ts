import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ChatEvent, ChatMessage, MessageType } from '@/types/chat';
import { api } from '@/lib/api-client';
import { db } from '@/lib/chat-db';
import { io, Socket } from 'socket.io-client';

interface UseChatSocketProps {
    roomId?: string;
    onMessage?: (message: ChatMessage) => void;
}

export function useChatSocket({ roomId, onMessage }: UseChatSocketProps = {}) {
    const socket = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const queryClient = useQueryClient();

    const connect = useCallback(() => {
        const token = api.getToken();
        if (!token) return;

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';


        const s = io(wsUrl, {
            path: '/chat/socket.io', // fastify-socket.io default path
            query: { token },
            transports: ['websocket'],
            reconnectionAttempts: 5,
        });

        s.on('connect', () => {
            console.log('Chat Socket.IO connected');
            setIsConnected(true);
            if (roomId) {
                s.emit('JOIN_ROOM', { roomId });
            }
            // Trigger background sync on reconnection
            db.processPendingMessages((syncedMsg) => {
                // Update React Query cache when a background message is successfully sent
                queryClient.invalidateQueries({ queryKey: ['chat-messages', syncedMsg.roomId] });
            });
        });

        s.on('disconnect', () => {
            console.log('Chat Socket.IO disconnected');
            setIsConnected(false);
        });

        // The backend wraps system events in an 'event' envelope
        s.on('event', (data: ChatEvent) => {
            handleEvent(data);
        });

        // Other direct events
        s.on('ERROR', (err: any) => {
            console.error('Socket error:', err);
        });

        socket.current = s;
    }, [roomId]);

    const handleEvent = useCallback((event: ChatEvent) => {
        const { type, payload } = event;

        switch (type) {
            case 'NEW_MESSAGE': {
                const newMessage = payload as ChatMessage;

                // 1. Update React Query cache for history
                queryClient.setQueryData(
                    ['chat-messages', newMessage.roomId],
                    (old: any) => {
                        if (!old) return { pages: [{ data: [newMessage] }], pageParams: [] };

                        // Deduplication: Remove the optimistic placeholder if it matches the content
                        const cleanPages = old.pages.map((page: any, index: number) => {
                            if (index === 0) {
                                const filteredData = page.data.filter((m: ChatMessage) =>
                                    !(m.status === 'SENDING' && m.content === newMessage.content)
                                );
                                return { ...page, data: [newMessage, ...filteredData] };
                            }
                            return page;
                        });

                        return { ...old, pages: cleanPages };
                    }
                );

                // 2. Persist to Dexie
                db.upsertMessage(newMessage);

                // 3. Callback
                onMessage?.(newMessage);
                break;
            }

            case 'USER_TYPING': {
                if (payload.roomId === roomId) {
                    setTypingUsers(prev => new Set([...prev, payload.userId]));
                }
                break;
            }

            case 'USER_STOPPED_TYPING': {
                if (payload.roomId === roomId) {
                    setTypingUsers(prev => {
                        const next = new Set(prev);
                        next.delete(payload.userId);
                        return next;
                    });
                }
                break;
            }

            case 'USER_ONLINE':
            case 'USER_OFFLINE': {
                // Update presence in cache or global state
                queryClient.setQueryData(['presence', payload.userId], type === 'USER_ONLINE' ? 'ONLINE' : 'OFFLINE');
                break;
            }

            case 'USER_BLOCKED':
            case 'USER_UNBLOCKED': {
                // Invalidate block status queries for this user
                queryClient.invalidateQueries({ queryKey: ["block-status", payload.blockerId] });
                // If the user who blocked us is the one we are currently chatting with
                // we might want to trigger a UI refresh or close the connection
                break;
            }
        }
    }, [roomId, queryClient, onMessage]);

    useEffect(() => {
        connect();
        return () => {
            socket.current?.close();
        };
    }, [connect]);

    const sendMessage = useCallback((content: string, type: MessageType = MessageType.TEXT, mediaUrl?: string) => {
        if (!socket.current || !roomId) return;

        // Optimistic Update
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage: ChatMessage = {
            _id: tempId,
            tempId,
            roomId,
            senderId: 'current-user-id', // In a real app, use actual current user ID
            content,
            type,
            mediaUrl,
            status: 'SENDING',
            isDeleted: false,
            isEdited: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        queryClient.setQueryData(
            ['chat-messages', roomId],
            (old: any) => {
                if (!old) return { pages: [{ data: [optimisticMessage] }], pageParams: [] };
                return {
                    ...old,
                    pages: old.pages.map((page: any, index: number) =>
                        index === 0
                            ? { ...page, data: [optimisticMessage, ...page.data] }
                            : page
                    )
                };
            }
        );

        // Persist optimistic message to Dexie for offline visibility
        db.messages.put(optimisticMessage);

        // Hybrid Strategy:
        // 1. If it's a TEXT message without media AND socket is connected, use WEBSOCKET (High speed)
        // 2. Otherwise, use HTTP (Better for large payloads/media and guaranteed delivery)
        if (type === MessageType.TEXT && !mediaUrl && isConnected) {
            socket.current.emit('SEND_MESSAGE', {
                roomId,
                content,
                msgType: type,
                mediaUrl,
                tempId // Pass tempId so backend can echo it back for reconciliation
            });
        } else {
            api.post<ChatMessage>(`/rooms/${roomId}/messages`, { content, type, mediaUrl })
                .then(response => {
                    db.upsertMessage({ ...response, tempId });
                })
                .catch(async err => {
                    console.error('Failed to send message, queueing for background sync', err);
                    // Queue for background sync
                    await db.queuePendingMessage(roomId, content, tempId, type);
                    // Update UI to show error/retrying status
                    queryClient.setQueryData(
                        ['chat-messages', roomId],
                        (old: any) => {
                            if (!old) return old;
                            return {
                                ...old,
                                pages: old.pages.map((page: any) => ({
                                    ...page,
                                    data: page.data.map((m: ChatMessage) =>
                                        m.tempId === tempId ? { ...m, status: 'ERROR' } : m
                                    )
                                }))
                            };
                        }
                    );
                });
        }
    }, [roomId, queryClient, isConnected]);


    const sendTyping = useCallback((isTyping: boolean) => {
        if (!socket.current || !roomId) return;

        socket.current.emit(isTyping ? 'TYPING' : 'STOP_TYPING', { roomId });
    }, [roomId]);

    const retryMessage = useCallback(async (tempId: string) => {
        const failedMsg = await db.pendingMessages.where('tempId').equals(tempId).first();
        if (failedMsg) {
            // Delete from pending so sendMessage doesn't create a duplicate entry in its logic
            await db.pendingMessages.delete(failedMsg.id!);
            sendMessage(failedMsg.content, failedMsg.type, failedMsg.mediaUrl);
        }
    }, [sendMessage]);

    return {
        isConnected,
        sendMessage,
        sendTyping,
        retryMessage,
        typingUsers: Array.from(typingUsers),
    };
}
