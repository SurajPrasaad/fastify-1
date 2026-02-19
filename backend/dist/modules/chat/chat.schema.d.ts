import { z } from "zod";
import { MessageType } from "./chat.model.js";
export declare const createRoomSchema: z.ZodObject<{
    participants: z.ZodArray<z.ZodString>;
    type: z.ZodDefault<z.ZodEnum<{
        DIRECT: "DIRECT";
        GROUP: "GROUP";
    }>>;
    name: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const sendMessageSchema: z.ZodObject<{
    roomId: z.ZodString;
    content: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<typeof MessageType>>;
    mediaUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const getMessagesSchema: z.ZodObject<{
    roomId: z.ZodString;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    before: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const getRoomsSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    offset: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export declare const wsMessageSchema: z.ZodObject<{
    type: z.ZodEnum<{
        MESSAGE: "MESSAGE";
        TYPING: "TYPING";
        READ_RECEPT: "READ_RECEPT";
        PRESENCE: "PRESENCE";
    }>;
    payload: z.ZodAny;
}, z.core.$strip>;
export declare const wsPayloadMessageSchema: z.ZodObject<{
    roomId: z.ZodString;
    content: z.ZodString;
    msgType: z.ZodDefault<z.ZodEnum<typeof MessageType>>;
    mediaUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const wsPayloadTypingSchema: z.ZodObject<{
    roomId: z.ZodString;
    isTyping: z.ZodBoolean;
}, z.core.$strip>;
export declare const wsPayloadReadSchema: z.ZodObject<{
    roomId: z.ZodString;
    messageId: z.ZodString;
}, z.core.$strip>;
//# sourceMappingURL=chat.schema.d.ts.map