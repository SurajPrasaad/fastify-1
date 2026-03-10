"use client"

import { useEffect } from "react";
import { socketService } from "@/services/socket.service";
import { useChatStore } from "@/features/chat/store/chat-store";
import { toast } from "sonner";
import { MessageStatus } from "../types/chat.types";
import { useAuth } from "@/features/auth/components/AuthProvider";

/**
 * Global component that maintains a background WebSocket connection 
 * for real-time notifications, even when not on the messages page.
 */
export function RealtimeChatListener() {
    const { user } = useAuth();
    const addMessage = useChatStore(state => state.addMessage);
    const setTyping = useChatStore(state => state.setTyping);
    const setOnlineStatus = useChatStore(state => state.setOnlineStatus);
    const updateMessage = useChatStore(state => state.updateMessage);

    useEffect(() => {
        if (!user) return;

        // Initial connection if not already connected
        if (!socketService.isConnected()) {
            socketService.connect();
        }

        const handlers = {
            NEW_MESSAGE: (message: any) => {
                const roomId = message.roomId || message.conversationId;
                addMessage(roomId, message);

                // If message is from someone else, notify them it was delivered
                if (user && message.senderId !== user.id) {
                    socketService.send('DELIVERY_RECEIPT', {
                        roomId,
                        messageId: message.id || message._id
                    });
                }
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
            READ_ACK: (data: { roomId: string; userId: string; messageId: string }) => {
                updateMessage(data.roomId, data.messageId, { status: MessageStatus.READ });
            },
            DELIVERY_ACK: (data: { roomId: string; userId: string; messageId: string }) => {
                updateMessage(data.roomId, data.messageId, { status: MessageStatus.DELIVERED });
            },
            ERROR: (err: any) => {
                console.error("Socket Error:", err);
            },
            // The server often wraps events in a generic 'event' payload
            event: (data: any) => {
                if (!data || !data.type) return;

                // Route to existing handlers
                const handler = handlers[data.type as keyof typeof handlers];
                if (handler) {
                    handler(data.payload);
                }
            }
        };

        // Attach listeners
        Object.entries(handlers).forEach(([event, handler]) => {
            socketService.on(event, handler);
        });

        return () => {
            Object.entries(handlers).forEach(([event, handler]) => {
                socketService.off(event, handler);
            });
        };
    }, [user, addMessage, setTyping, setOnlineStatus, updateMessage]);

    return null; // This component doesn't render anything
}
