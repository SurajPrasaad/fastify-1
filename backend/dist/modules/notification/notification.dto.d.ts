import { z } from "zod";
export declare const NotificationEntityTypeSchema: z.ZodEnum<{
    POST: "POST";
    COMMENT: "COMMENT";
    FOLLOW: "FOLLOW";
    CHAT: "CHAT";
    SYSTEM: "SYSTEM";
}>;
export type NotificationEntityType = z.infer<typeof NotificationEntityTypeSchema>;
export declare const DeliveryChannelSchema: z.ZodEnum<{
    PUSH: "PUSH";
    EMAIL: "EMAIL";
    IN_APP: "IN_APP";
}>;
export type DeliveryChannel = z.infer<typeof DeliveryChannelSchema>;
export declare const SendNotificationSchema: z.ZodObject<{
    recipientId: z.ZodString;
    actorId: z.ZodOptional<z.ZodString>;
    templateSlug: z.ZodString;
    entityType: z.ZodEnum<{
        POST: "POST";
        COMMENT: "COMMENT";
        FOLLOW: "FOLLOW";
        CHAT: "CHAT";
        SYSTEM: "SYSTEM";
    }>;
    entityId: z.ZodString;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    metaData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>;
export type SendNotificationInput = z.infer<typeof SendNotificationSchema>;
export interface NotificationEvent {
    id: string;
    recipientId: string;
    actorId?: string;
    entityType: NotificationEntityType;
    entityId: string;
    message: string;
    createdAt: string;
}
export declare const RegisterDeviceSchema: z.ZodObject<{
    token: z.ZodString;
    platform: z.ZodEnum<{
        IOS: "IOS";
        ANDROID: "ANDROID";
        WEB: "WEB";
    }>;
    deviceId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type RegisterDeviceInput = z.infer<typeof RegisterDeviceSchema>;
export declare const UpdatePreferencesSchema: z.ZodObject<{
    preferences: z.ZodArray<z.ZodObject<{
        templateSlug: z.ZodString;
        channel: z.ZodEnum<{
            PUSH: "PUSH";
            EMAIL: "EMAIL";
            IN_APP: "IN_APP";
        }>;
        isEnabled: z.ZodBoolean;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesSchema>;
export declare const GetNotificationsQuerySchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    cursor: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type GetNotificationsQuery = z.infer<typeof GetNotificationsQuerySchema>;
//# sourceMappingURL=notification.dto.d.ts.map