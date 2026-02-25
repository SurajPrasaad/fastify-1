
import type { FastifyReply, FastifyRequest } from "fastify";
import { ChatService } from "./chat.service.js";
import { ChatRepository } from "./chat.repository.js";
import { UserRepository } from "../user/user.repository.js";
import {
    createRoomSchema,
    getMessagesSchema,
    getRoomsSchema,
    searchMessagesSchema,
    sendMessageSchema,
    markAsReadSchema
} from "./chat.schema.js";

const chatRepository = new ChatRepository();
const userRepository = new UserRepository();
const chatService = new ChatService(chatRepository, userRepository);

export async function sendMessageHandler(
    request: FastifyRequest<{ Params: { roomId: string }, Body: Record<string, any> }>,
    reply: FastifyReply
) {
    const userId = request.user!.sub;
    const { roomId } = request.params;
    const { content, type, mediaUrl } = sendMessageSchema.parse({
        ...request.body,
        roomId
    });

    const message = await chatService.sendMessage(userId, roomId, content, type, mediaUrl);
    return reply.status(201).send(message);
}

export async function createRoomHandler(
    request: FastifyRequest<{ Body: Record<string, any> }>,
    reply: FastifyReply
) {
    const userId = request.user!.sub;
    const { participants, type, name } = createRoomSchema.parse(request.body);
    const room = await chatService.createRoom(userId, participants, type, name);
    return reply.status(201).send(room);
}

export async function getConversationsHandler(
    request: FastifyRequest<{ Querystring: Record<string, any> }>,
    reply: FastifyReply
) {
    const userId = request.user!.sub;
    const { limit, offset } = getRoomsSchema.parse(request.query);
    const rooms = await chatService.getConversations(userId, limit, offset);
    return reply.send(rooms);
}

export async function getHistoryHandler(
    request: FastifyRequest<{ Params: { roomId: string }, Querystring: Record<string, any> }>,
    reply: FastifyReply
) {
    const userId = request.user!.sub;
    const { roomId } = request.params;
    // Merge params and query for validation against getMessagesSchema which includes roomId
    const { limit, before } = getMessagesSchema.parse({
        ...request.query,
        roomId
    });
    const messages = await chatService.getHistory(roomId, userId, limit, before);
    return reply.send(messages);
}

export async function getPresenceHandler(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
) {
    const { userId } = request.params;
    const presence = await chatService.getUserPresence(userId);
    return reply.send(presence);
}

export async function searchMessagesHandler(
    request: FastifyRequest<{ Querystring: Record<string, any> }>,
    reply: FastifyReply
) {
    const userId = request.user!.sub;
    const { q, limit, offset } = searchMessagesSchema.parse(request.query);
    const messages = await chatService.searchMessages(userId, q, limit, offset);
    return reply.send(messages);
}

export async function markAsReadHandler(
    request: FastifyRequest<{ Params: { roomId: string } }>,
    reply: FastifyReply
) {
    const userId = request.user!.sub;
    const { roomId } = markAsReadSchema.parse(request.params);

    // We pass null for messageId to signify marking the entire room as read up to 'now'
    await chatService.markAsRead(userId, roomId, null as any);
    return reply.status(200).send({ success: true });
}

export async function clearChatHistoryHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const userId = request.user!.sub;
    await chatService.clearHistory(userId);
    return reply.status(204).send();
}

export async function deleteAllChatsHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const userId = request.user!.sub;
    await chatService.deleteAllRooms(userId);
    return reply.status(204).send();
}
