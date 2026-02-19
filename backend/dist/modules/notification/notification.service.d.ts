import { NotificationRepository } from "./notification.repository.js";
import type { SendNotificationInput, RegisterDeviceInput } from "./notification.dto.js";
export declare class NotificationService {
    private repository;
    constructor(repository: NotificationRepository);
    /**
     * Primary entry point for all notification events
     * Orchestrates: Deduplication -> Persistence -> Fan-out to Channels
     */
    handleEvent(event: SendNotificationInput): Promise<void>;
    private hydrateTemplate;
    private resolveEnabledChannels;
    private isQuietHours;
    private enqueueDelivery;
    private notifyInApp;
    getNotifications(userId: string, limit: number, cursor?: string): Promise<{
        id: string;
        recipientId: string;
        actorId: string | null;
        templateId: string | null;
        entityType: "POST" | "COMMENT" | "FOLLOW" | "CHAT" | "SYSTEM";
        entityId: string;
        message: string;
        isRead: boolean;
        metaData: {
            count?: number | undefined;
            lastActorId?: string | undefined;
            actionUrl?: string | undefined;
            image?: string | undefined;
        } | null;
        createdAt: Date;
    }[]>;
    registerDevice(userId: string, input: RegisterDeviceInput): Promise<void>;
    markRead(id: string, userId: string): Promise<{
        id: string;
        recipientId: string;
        actorId: string | null;
        templateId: string | null;
        entityType: "POST" | "COMMENT" | "FOLLOW" | "CHAT" | "SYSTEM";
        entityId: string;
        message: string;
        isRead: boolean;
        metaData: {
            count?: number | undefined;
            lastActorId?: string | undefined;
            actionUrl?: string | undefined;
            image?: string | undefined;
        } | null;
        createdAt: Date;
    } | undefined>;
}
//# sourceMappingURL=notification.service.d.ts.map