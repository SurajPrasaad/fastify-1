import { z } from "zod";
import { MessageType } from "./chat.model.js";
export const createRoomSchema = z.object({
    participants: z.array(z.string().uuid()).min(1),
    type: z.enum(['DIRECT', 'GROUP']).default('DIRECT'),
    name: z.string().optional(),
});
export const sendMessageSchema = z.object({
    roomId: z.string(),
    content: z.string().min(1),
    type: z.nativeEnum(MessageType).default(MessageType.TEXT),
    mediaUrl: z.string().url().optional(),
});
export const getMessagesSchema = z.object({
    roomId: z.string(),
    limit: z.coerce.number().min(1).max(100).default(50),
    before: z.string().optional(), // Timestamp or ID for pagination
});
export const getRoomsSchema = z.object({
    limit: z.coerce.number().min(1).max(50).default(20),
    offset: z.coerce.number().min(0).default(0),
});
// WebSocket Event Schemas
export const wsMessageSchema = z.object({
    type: z.enum(['MESSAGE', 'TYPING', 'READ_RECEPT', 'PRESENCE']),
    payload: z.any()
});
export const wsPayloadMessageSchema = z.object({
    roomId: z.string(),
    content: z.string(),
    msgType: z.nativeEnum(MessageType).default(MessageType.TEXT),
    mediaUrl: z.string().optional(),
});
export const wsPayloadTypingSchema = z.object({
    roomId: z.string(),
    isTyping: z.boolean(),
});
export const wsPayloadReadSchema = z.object({
    roomId: z.string(),
    messageId: z.string(),
});
//# sourceMappingURL=chat.schema.js.map