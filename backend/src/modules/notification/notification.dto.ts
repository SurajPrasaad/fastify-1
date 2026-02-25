import { z } from "zod";

// ─── Notification Type Enum ─────────────────────────────────────────────────
export const NotificationTypeEnum = z.enum([
    "LIKE",
    "COMMENT",
    "REPLY",
    "MENTION",
    "FOLLOW",
    "REPOST",
    "SYSTEM",
    "VERIFIED",
]);
export type NotificationType = z.infer<typeof NotificationTypeEnum>;

// ─── Entity Type (for DB schema compatibility) ──────────────────────────────
export const NotificationEntityTypeSchema = z.enum([
    "POST",
    "COMMENT",
    "FOLLOW",
    "CHAT",
    "SYSTEM",
]);
export type NotificationEntityType = z.infer<typeof NotificationEntityTypeSchema>;

// ─── Delivery Channel ───────────────────────────────────────────────────────
export const DeliveryChannelSchema = z.enum(["PUSH", "EMAIL", "IN_APP"]);
export type DeliveryChannel = z.infer<typeof DeliveryChannelSchema>;

// ─── Create Notification (internal) ─────────────────────────────────────────
export const CreateNotificationSchema = z.object({
    type: NotificationTypeEnum,
    senderId: z.string().uuid(),
    receiverId: z.string().uuid(),
    postId: z.string().uuid().nullable().optional(),
    commentId: z.string().uuid().nullable().optional(),
    message: z.string().min(1).max(500),
    metaData: z
        .object({
            count: z.number().optional(),
            lastActorId: z.string().optional(),
            actionUrl: z.string().optional(),
            image: z.string().optional(),
            snippet: z.string().optional(),
        })
        .optional(),
});
export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;

// ─── Send Notification (via Kafka/RabbitMQ ingestion) ───────────────────────
export const SendNotificationSchema = z.object({
    recipientId: z.string().uuid(),
    actorId: z.string().uuid().optional(),
    templateSlug: z.string(),
    entityType: NotificationEntityTypeSchema,
    entityId: z.string().uuid(),
    data: z.record(z.string(), z.any()).optional(),
    metaData: z.record(z.string(), z.any()).optional(),
});
export type SendNotificationInput = z.infer<typeof SendNotificationSchema>;

// ─── WebSocket Event Payload ────────────────────────────────────────────────
export interface NotificationWSPayload {
    id: string;
    type: NotificationType;
    sender: {
        id: string;
        username: string;
        name: string;
        avatarUrl?: string | undefined;
    };
    message: string;
    postId?: string | null;
    commentId?: string | null;
    actionUrl?: string;
    createdAt: string;
}

// ─── Legacy NotificationEvent (for Redis pub/sub compat) ────────────────────
export interface NotificationEvent {
    id: string;
    recipientId: string;
    actorId?: string;
    entityType: NotificationEntityType;
    entityId: string;
    message: string;
    createdAt: string;
    // Enhanced fields
    type?: NotificationType;
    sender?: {
        id: string;
        username: string;
        name: string;
        avatarUrl?: string | undefined;
    };
    postId?: string | null;
    commentId?: string | null;
}

// ─── Register Device ────────────────────────────────────────────────────────
export const RegisterDeviceSchema = z.object({
    token: z.string().min(1),
    platform: z.enum(["IOS", "ANDROID", "WEB"]),
    deviceId: z.string().optional(),
});
export type RegisterDeviceInput = z.infer<typeof RegisterDeviceSchema>;

// ─── Update Preferences ────────────────────────────────────────────────────
export const UpdatePreferencesSchema = z.object({
    preferences: z.array(
        z.object({
            templateSlug: z.string(),
            channel: DeliveryChannelSchema,
            isEnabled: z.boolean(),
        })
    ),
});
export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesSchema>;

// ─── Get Notifications Query ────────────────────────────────────────────────
export const GetNotificationsQuerySchema = z.object({
    limit: z.coerce.number().min(1).max(50).default(20),
    cursor: z.string().optional(),
    type: NotificationTypeEnum.optional(), // Filter by type
});
export type GetNotificationsQuery = z.infer<typeof GetNotificationsQuerySchema>;

// ─── Unread Count Response ──────────────────────────────────────────────────
export const UnreadCountResponseSchema = z.object({
    count: z.number(),
});
export type UnreadCountResponse = z.infer<typeof UnreadCountResponseSchema>;

// ─── Mention Parsing Result ─────────────────────────────────────────────────
export interface MentionParseResult {
    usernames: string[];
    sanitizedText: string;
}
