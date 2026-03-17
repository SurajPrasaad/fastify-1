import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChatService, SendMessageDto } from "../services/chat-api";
import { useAuthStore } from "../store/auth-store";

export const useConversations = () => {
    const { user } = useAuthStore();

    return useInfiniteQuery({
        queryKey: ["conversations", user?.id],
        queryFn: async ({ pageParam }) => {
            return ChatService.fetchConversations(20, pageParam as string);
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        initialPageParam: undefined as string | undefined,
        enabled: !!user,
    });
};

export const useChatHistory = (roomId: string) => {
    const { user } = useAuthStore();

    return useInfiniteQuery({
        queryKey: ["chat-history", roomId, user?.id],
        queryFn: async ({ pageParam }) => {
            return ChatService.fetchChatHistory(roomId, 50, pageParam as string);
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        initialPageParam: undefined as string | undefined,
        enabled: !!user && !!roomId,
    });
};

export const useSendMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: SendMessageDto) => ChatService.sendChatMessage(data),
        onSuccess: (newMessage) => {
            // Update the chat history cache optimistically or refetch
            queryClient.invalidateQueries({ queryKey: ["chat-history", newMessage.conversationId] });
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
        },
    });
};

export const useMarkChatAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (roomId: string) => ChatService.markAsRead(roomId),
        onSuccess: (_, roomId) => {
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
        },
    });
};
