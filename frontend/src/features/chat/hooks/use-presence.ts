import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { UserPresence } from '@/types/chat';

export function usePresence(userId: string) {
    return useQuery({
        queryKey: ['presence', userId],
        queryFn: async () => {
            return await api.get<UserPresence>(`/presence/${userId}`);
        },
        enabled: !!userId,
        refetchInterval: 60000, // Poll every minute as fallback
    });
}
