"use client";

import { useEffect } from "react";
import { socketService } from "@/services/socket.service";
import { useChatStore } from "@/features/chat/store/chat-store";
import { useUser } from "@/hooks/use-auth";
import { toast } from "sonner";

export function useChatSocket(roomId?: string) {
    const addMessage = useChatStore(state => state.addMessage);

    useEffect(() => {
        // The RealtimeChatListener component will handle global socket connection and core events.
        // This hook will now only manage room-specific logic.

        // Request room presence if roomId changes
        if (roomId) {
            socketService.send("JOIN_ROOM", { roomId });
        }

        return () => {
            if (roomId) {
                socketService.send("LEAVE_ROOM", { roomId });
            }
            // No need to manage event listeners here, RealtimeChatListener handles them.
        };
    }, [roomId]); // Dependencies reduced as global listeners are moved

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

        socketService.send("SEND_MESSAGE", { roomId, content, type, mediaUrl, tempId });
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

