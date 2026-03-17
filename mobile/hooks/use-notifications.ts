import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NotificationService, NotificationType } from "../services/notification-service";
import { useAuthStore } from "../store/auth-store";

export const useNotifications = (type?: NotificationType) => {
    const { user } = useAuthStore();

    return useInfiniteQuery({
        queryKey: ["notifications", user?.id, type],
        queryFn: async ({ pageParam }) => {
            return NotificationService.getNotifications({ cursor: pageParam as string, type });
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        initialPageParam: undefined as string | undefined,
        enabled: !!user,
    });
};

export const useUnreadCount = () => {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: ["notifications", "unread", user?.id],
        queryFn: async () => {
            const response = await NotificationService.getUnreadCount();
            return response.count;
        },
        enabled: !!user,
        refetchInterval: 30000,
    });
};

export const useMarkAllRead = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: NotificationService.markAllRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.setQueryData(["notifications", "unread", user?.id], 0);
        },
    });
};
