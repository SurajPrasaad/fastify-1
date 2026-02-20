
import { useEffect } from 'react';
import { useChatStore } from '../store/chat-store';
import { ChatService } from '../services/chat.service';

export const usePresence = (userIds: string[]) => {
    const { presenceMap, setPresence } = useChatStore();

    useEffect(() => {
        if (userIds.length === 0) return;

        const fetchPresence = async () => {
            try {
                const results = await ChatService.batchFetchPresence(userIds);
                Object.entries(results).forEach(([id, presence]) => {
                    setPresence(id, presence);
                });
            } catch (error) {
                console.error('Failed to batch fetch presence:', error);
            }
        };

        fetchPresence();

        // Polling as fallback if socket fails for some reason
        const interval = setInterval(fetchPresence, 60000); // Every 1 minute

        return () => clearInterval(interval);
    }, [JSON.stringify(userIds), setPresence]);

    return {
        getPresence: (id: string) => presenceMap[id],
        isOnline: (id: string) => presenceMap[id]?.status === 'ONLINE'
    };
};
