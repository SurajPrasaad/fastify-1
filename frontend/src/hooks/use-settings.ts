import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export interface ChatSettings {
    enterToSend: boolean;
    typingIndicators: boolean;
    readReceipts: boolean;
    mediaAutoDownload: boolean;
    saveToGallery: boolean;
}

export interface SupportTicket {
    id: string;
    subject: string;
    description: string;
    category: string;
    status: string;
    priority: string;
    createdAt: string;
}

export interface DataRequest {
    id: string;
    status: string;
    archiveUrl?: string;
    expiresAt?: string;
    createdAt: string;
}

export interface UserSession {
    id: string;
    deviceId: string;
    ipAddress: string;
    userAgent: string;
    lastActiveAt: string;
    isValid: boolean;
}

export interface AuditLog {
    id: string;
    action: string;
    status: string;
    ipAddress: string;
    createdAt: string;
    metadata: any;
}

export function useSettings() {
    const queryClient = useQueryClient();

    // Chat Settings
    const chatSettings = useQuery({
        queryKey: ["settings", "chat"],
        queryFn: () => api.get<ChatSettings>("/settings/chat"),
    });

    const updateChatSettings = useMutation({
        mutationFn: (data: Partial<ChatSettings>) => api.patch<ChatSettings>("/settings/chat", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings", "chat"] });
            toast.success("Chat settings updated");
        },
    });

    const clearChatHistory = useMutation({
        mutationFn: () => api.delete("/chat/history/clear"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["chat"] });
            toast.success("Chat history cleared successfully");
        }
    });

    const deleteAllChats = useMutation({
        mutationFn: () => api.delete("/chat/rooms/all"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["chat"] });
            toast.success("All conversations deleted");
        }
    });

    // Support Tickets
    const tickets = useQuery({
        queryKey: ["settings", "tickets"],
        queryFn: () => api.get<SupportTicket[]>("/settings/tickets"),
    });

    const createTicket = useMutation({
        mutationFn: (data: { subject: string; description: string; category: string }) =>
            api.post<SupportTicket>("/settings/tickets", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings", "tickets"] });
            toast.success("Ticket created successfully");
        },
    });

    // Data Archives
    const dataRequests = useQuery({
        queryKey: ["settings", "data-requests"],
        queryFn: () => api.get<DataRequest[]>("/settings/data/requests"),
    });

    const requestDataArchive = useMutation({
        mutationFn: () => api.post<DataRequest>("/settings/data/request"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings", "data-requests"] });
            toast.success("Data archive requested. We'll notify you when it's ready.");
        },
    });

    // Sessions & Activity
    const sessions = useQuery({
        queryKey: ["settings", "sessions"],
        queryFn: () => api.get<UserSession[]>("/settings/sessions"),
    });

    const auditLogs = useQuery({
        queryKey: ["settings", "logs"],
        queryFn: () => api.get<AuditLog[]>("/settings/logs"),
    });

    const revokeSession = useMutation({
        mutationFn: (sessionId: string) => api.delete(`/settings/sessions/${sessionId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings", "sessions"] });
            toast.success("Session revoked");
        },
    });

    const revokeAllSessions = useMutation({
        mutationFn: () => api.delete("/settings/sessions/all"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings", "sessions"] });
            toast.success("All other sessions revoked");
        },
    });

    // Blocking
    const blockedUsers = useQuery({
        queryKey: ["blocks"],
        queryFn: () => api.get<any[]>("/blocks"),
    });

    const unblockUser = useMutation({
        mutationFn: (userId: string) => api.delete(`/blocks/${userId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["blocks"] });
            toast.success("User unblocked");
        },
    });

    return {
        chatSettings,
        updateChatSettings,
        tickets,
        createTicket,
        dataRequests,
        requestDataArchive,
        sessions,
        auditLogs,
        revokeSession,
        revokeAllSessions,
        blockedUsers,
        unblockUser,
        clearChatHistory,
        deleteAllChats,
    };
}
