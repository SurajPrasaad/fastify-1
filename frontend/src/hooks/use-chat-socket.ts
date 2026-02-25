"use client";

import { useEffect } from "react";
import { socketService } from "@/services/socket.service";
import { useChatStore } from "@/features/chat/store/chat.store";
import { useUser } from "@/hooks/use-auth";
import { toast } from "sonner";

export function useChatSocket(roomId?: string) {
    const addMessage = useChatStore(state => state.addMessage);
    const setTyping = useChatStore(state => state.setTyping);
    const setOnlineStatus = useChatStore(state => state.setOnlineStatus);

    useEffect(() => {
        socketService.connect();

        const handlers = {
            NEW_MESSAGE: (message: any) => {
                addMessage(message.roomId, message);
            },
            USER_ONLINE: (data: { userId: string }) => {
                setOnlineStatus(data.userId, true);
            },
            USER_OFFLINE: (data: { userId: string }) => {
                setOnlineStatus(data.userId, false);
            },
            USER_TYPING: (data: { roomId: string; userId: string }) => {
                setTyping(data.roomId, data.userId, true);
            },
            USER_STOPPED_TYPING: (data: { roomId: string; userId: string }) => {
                setTyping(data.roomId, data.userId, false);
            },
            ROOM_PRESENCE: (data: { roomId: string; onlineParticipants: string[] }) => {
                data.onlineParticipants.forEach(userId => setOnlineStatus(userId, true));
            },
            ERROR: (err: any) => {
                console.error("Socket Error:", err);
            }
        };

        // Attach listeners
        Object.entries(handlers).forEach(([event, handler]) => {
            socketService.on(event, handler);
        });

        // Request room presence if roomId changes
        if (roomId) {
            socketService.send("JOIN_ROOM", { roomId });
        }

        return () => {
            Object.entries(handlers).forEach(([event, handler]) => {
                socketService.off(event, handler);
            });
        };
    }, [roomId, addMessage, setTyping, setOnlineStatus]);

    const { data: currentUser } = useUser();

    const sendMessage = (content: string, type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' = 'TEXT', mediaUrl?: string) => {
        if (!roomId) return;

        if (!socketService.isConnected()) {
            socketService.connect();
            toast.error("Connecting to chat server...");
            return;
        }

        // Optimistic Update
        const tempId = `temp-${Date.now()}`;
        addMessage(roomId, {
            id: tempId,
            tempId,
            roomId,
            conversationId: roomId,
            senderId: currentUser?.id || 'me',
            sender: {
                id: currentUser?.id || 'me',
                name: currentUser?.name || 'Me',
                username: currentUser?.username || 'me',
                avatarUrl: currentUser?.avatarUrl || undefined
            },
            content,
            type,
            mediaUrl,
            status: 'SENDING',
            createdAt: new Date().toISOString(),
        } as any);

        socketService.send("SEND_MESSAGE", { roomId, content, type, mediaUrl });
    };

    const sendTyping = (isTyping: boolean) => {
        if (!roomId) return;
        socketService.send(isTyping ? "TYPING" : "STOP_TYPING", { roomId });
    };

    const markAsRead = (messageId: string) => {
        if (!roomId) return;
        socketService.send("READ_RECEIPT", { roomId, messageId });
    };

    return {
        sendMessage,
        sendTyping,
        markAsRead
    };
}

