import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ChatMessage } from '@/types/chat';
import { db } from '@/lib/chat-db';

export function useChatMessages(roomId: string) {
    return useInfiniteQuery({
        queryKey: ['chat-messages', roomId],
        queryFn: async ({ pageParam }) => {
            const searchParams = new URLSearchParams();
            searchParams.append('limit', '30');
            if (pageParam) searchParams.append('before', pageParam);

            try {
                const data = await api.get<ChatMessage[]>(`/rooms/${roomId}/messages?${searchParams.toString()}`);
                const messages = Array.isArray(data) ? data : [];

                // Persistence: FAANG-level background synchronization
                if (messages.length > 0) {
                    // We use bulkPut to ensure local cache is updated with server truth
                    await db.messages.bulkPut(messages);
                }

                return { data: messages };
            } catch (error) {
                // Offline-First: Fallback to IndexedDB if network is unavailable
                console.warn('Chat network failure, falling back to IndexedDB', error);

                const localQuery = pageParam
                    ? db.messages
                        .where('[roomId+createdAt]')
                        .between([roomId, ''], [roomId, pageParam], true, false) // Fetch messages before the cursor
                    : db.messages.where('roomId').equals(roomId);

                const localMessages = await localQuery
                    .reverse()
                    .limit(30)
                    .toArray();

                if (localMessages.length > 0) {
                    return { data: localMessages };
                }

                throw error;
            }
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => {
            if (!lastPage.data || lastPage.data.length < 30) return undefined;
            return lastPage.data[lastPage.data.length - 1].createdAt;
        },
        enabled: !!roomId,
        // Performance optimization: Don't refetch if we have data and it's fresh
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
