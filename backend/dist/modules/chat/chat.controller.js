import { ChatService } from "./chat.service.js";
import { ChatRepository } from "./chat.repository.js";
import { createRoomSchema, getMessagesSchema, getRoomsSchema } from "./chat.schema.js";
const chatRepository = new ChatRepository();
const chatService = new ChatService(chatRepository);
export async function createRoomHandler(request, reply) {
    const userId = request.user.sub;
    const { participants, type, name } = createRoomSchema.parse(request.body);
    const room = await chatService.createRoom(userId, participants, type, name);
    return reply.status(201).send(room);
}
export async function getConversationsHandler(request, reply) {
    const userId = request.user.sub;
    const { limit, offset } = getRoomsSchema.parse(request.query);
    const rooms = await chatService.getConversations(userId, limit, offset);
    return reply.send(rooms);
}
export async function getHistoryHandler(request, reply) {
    const userId = request.user.sub;
    const { roomId } = request.params;
    // Merge params and query for validation against getMessagesSchema which includes roomId
    const { limit, before } = getMessagesSchema.parse({
        ...request.query,
        roomId
    });
    const messages = await chatService.getHistory(roomId, userId, limit, before);
    return reply.send(messages);
}
export async function getPresenceHandler(request, reply) {
    const { userId } = request.params;
    const presence = await chatService.getUserPresence(userId);
    return reply.send(presence);
}
//# sourceMappingURL=chat.controller.js.map