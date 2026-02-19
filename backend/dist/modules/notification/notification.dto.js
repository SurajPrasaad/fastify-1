import { z } from "zod";
export const NotificationEntityTypeSchema = z.enum(["POST", "COMMENT", "FOLLOW", "CHAT", "SYSTEM"]);
export const DeliveryChannelSchema = z.enum(["PUSH", "EMAIL", "IN_APP"]);
export const SendNotificationSchema = z.object({
    recipientId: z.string().uuid(),
    actorId: z.string().uuid().optional(),
    templateSlug: z.string(), // slug from notification_templates
    entityType: NotificationEntityTypeSchema,
    entityId: z.string().uuid(),
    data: z.record(z.string(), z.any()).optional(), // variable data for template substitution
    metaData: z.record(z.string(), z.any()).optional(),
});
export const RegisterDeviceSchema = z.object({
    token: z.string().min(1),
    platform: z.enum(["IOS", "ANDROID", "WEB"]),
    deviceId: z.string().optional(),
});
export const UpdatePreferencesSchema = z.object({
    preferences: z.array(z.object({
        templateSlug: z.string(),
        channel: DeliveryChannelSchema,
        isEnabled: z.boolean()
    }))
});
export const GetNotificationsQuerySchema = z.object({
    limit: z.coerce.number().min(1).max(50).default(20),
    cursor: z.string().optional()
});
//# sourceMappingURL=notification.dto.js.map