"use client"

import { useChatSocket } from "@/hooks/use-chat-socket";
import { useEffect } from "react";
import { socketService } from "@/services/socket.service";

/**
 * Global component that maintains a background WebSocket connection 
 * for real-time notifications, even when not on the messages page.
 */
export function RealtimeChatListener() {
    // Calling useChatSocket without a roomId provides a global listener 
    // for NEW_MESSAGE, USER_ONLINE, etc.
    useChatSocket();

    useEffect(() => {
        // Initial connection if not already connected
        if (!socketService.isConnected()) {
            socketService.connect();
        }
    }, []);

    return null; // This component doesn't render anything
}
