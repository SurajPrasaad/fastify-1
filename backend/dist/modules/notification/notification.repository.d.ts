import { deliveryAttempts } from "../../db/schema.js";
import type { NotificationEntityType, DeliveryChannel } from "./notification.dto.js";
export declare class NotificationRepository {
    createNotification(data: {
        recipientId: string;
        actorId?: string | undefined;
        templateId?: string | undefined;
        entityType: NotificationEntityType;
        entityId: string;
        message: string;
        metaData?: any;
    }): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        recipientId: string;
        actorId: string | null;
        templateId: string | null;
        entityType: "POST" | "COMMENT" | "FOLLOW" | "CHAT" | "SYSTEM";
        entityId: string;
        isRead: boolean;
        metaData: {
            count?: number | undefined;
            lastActorId?: string | undefined;
            actionUrl?: string | undefined;
            image?: string | undefined;
        } | null;
    } | undefined>;
    findAggregatableNotification(recipientId: string, entityId: string, entityType: NotificationEntityType): Promise<{
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
    updateNotification(id: string, data: {
        message?: string;
        metaData?: {
            count?: number | undefined;
            lastActorId?: string | undefined;
            actionUrl?: string | undefined;
            image?: string | undefined;
        };
    }): Promise<{
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
    getTemplateBySlug(slug: string): Promise<{
        id: string;
        slug: string;
        titleTemplate: string;
        bodyTemplate: string;
        isPushEnabled: boolean;
        isEmailEnabled: boolean;
        isInAppEnabled: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | undefined>;
    getUserSettings(userId: string): Promise<{
        userId: string;
        pushEnabled: boolean;
        emailEnabled: boolean;
        quietHoursStart: string | null;
        quietHoursEnd: string | null;
        timezone: string;
    } | undefined>;
    isChannelEnabled(userId: string, templateId: string, channel: DeliveryChannel): Promise<boolean>;
    getActiveDeviceTokens(userId: string): Promise<{
        id: string;
        userId: string;
        token: string;
        platform: "IOS" | "ANDROID" | "WEB";
        deviceId: string | null;
        isActive: boolean;
        lastUsedAt: Date;
        createdAt: Date;
    }[]>;
    registerDevice(userId: string, data: {
        token: string;
        platform: "IOS" | "ANDROID" | "WEB";
        deviceId?: string | undefined;
    }): Promise<void>;
    logDeliveryAttempt(data: typeof deliveryAttempts.$inferInsert): Promise<{
        error: string | null;
        id: string;
        status: "PENDING" | "FAILED" | "SENT" | "PERMANENT_FAILURE";
        createdAt: Date;
        channel: "PUSH" | "EMAIL";
        notificationId: string;
        attemptNumber: number;
        traceId: string | null;
    }[]>;
    updateDeliveryStatus(id: string, status: "SENT" | "FAILED" | "PERMANENT_FAILURE", error?: string): Promise<void>;
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
    markAsRead(id: string, userId: string): Promise<{
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
    markAllAsRead(userId: string): Promise<import("pg").QueryResult<never>>;
}
//# sourceMappingURL=notification.repository.d.ts.map