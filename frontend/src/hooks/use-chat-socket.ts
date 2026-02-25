"use client";

import { useEffect, useState } from "react";
import { socketService } from "@/services/socket.service";

export function useChatSocket(roomId?: string) {
    const [messages, setMessages] = useState<any[]>([]);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

    useEffect(() => {
        setMessages([]);
    }, [roomId]);

    useEffect(() => {
        // Connect when the hook is used
        socketService.connect();

        const onNewMessage = (message: any) => {
            if (roomId && message.roomId === roomId) {
                setMessages((prev) => {
                    // 1. If we already have this exact message (by real ID), do nothing
                    if (prev.some(m => m._id === message._id)) return prev;

                    // 2. Look for an optimistic message to replace (match by content + 'SENDING' status)
                    const optimisticIdx = prev.findLastIndex(m =>
                        m.status === 'SENDING' &&
                        m.content?.trim() === message.content?.trim()
                    );


                    if (optimisticIdx !== -1) {
                        const newMsgs = [...prev];
                        // Replace the temp message with the confirmed one
                        newMsgs[optimisticIdx] = { ...message, status: 'SENT' };
                        return newMsgs;
                    }

                    // 3. Otherwise, just append it
                    return [...prev, { ...message, status: 'SENT' }];
                });
            }
        };


        const onTyping = (data: { roomId: string; userId: string; isTyping: boolean }) => {
            if (roomId && data.roomId === roomId) {
                setTypingUsers((prev) => {
                    const newSet = new Set(prev);
                    if (data.isTyping) newSet.add(data.userId);
                    else newSet.delete(data.userId);
                    return newSet;
                });
            }
        };

        socketService.on("NEW_MESSAGE", onNewMessage);
        socketService.on("TYPING", onTyping);

        return () => {
            socketService.off("NEW_MESSAGE", onNewMessage);
            socketService.off("TYPING", onTyping);
        };
    }, [roomId]);

    const sendMessage = (content: string, type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' = 'TEXT', mediaUrl?: string) => {
        if (!roomId) return;

        // Optimistic update
        const optimisticMsg = {
            _id: `temp-${Date.now()}`,
            roomId,
            content,
            type: type,
            mediaUrl,
            status: 'SENDING',
            createdAt: new Date().toISOString(),
            senderId: 'me', // Will be replaced by real user data in component
        };

        setMessages(prev => [...prev, optimisticMsg]);

        socketService.send("SEND_MESSAGE", { roomId, content, type: type, mediaUrl });
    };

    const sendTyping = (isTyping: boolean) => {
        if (!roomId) return;
        socketService.send("TYPING", { roomId, isTyping });
    };

    const markAsRead = (messageId: string) => {
        if (!roomId) return;
        socketService.send("READ_RECEIPT", { roomId, messageId });
    };

    return {
        messages,
        typingUsers: Array.from(typingUsers),
        sendMessage,
        sendTyping,
        markAsRead
    };
}

