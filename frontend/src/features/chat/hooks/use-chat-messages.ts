import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ChatMessage } from '@/types/chat';

export function useChatMessages(roomId: string) {
    return useInfiniteQuery({
        queryKey: ['chat-messages', roomId],
        queryFn: async ({ pageParam }) => {
            const searchParams = new URLSearchParams();
            searchParams.append('limit', '30');
            if (pageParam) searchParams.append('before', pageParam);

            const data = await api.get<ChatMessage[]>(`/rooms/${roomId}/messages?${searchParams.toString()}`);
            return { data: Array.isArray(data) ? data : [] };
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => {
            if (!lastPage.data || lastPage.data.length < 30) return undefined;
            return lastPage.data[lastPage.data.length - 1].createdAt;
        },
        enabled: !!roomId,
    });
}
