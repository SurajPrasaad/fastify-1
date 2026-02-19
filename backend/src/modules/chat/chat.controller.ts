
import type { FastifyReply, FastifyRequest } from "fastify";
import { ChatService } from "./chat.service.js";
import { ChatRepository } from "./chat.repository.js";
import { UserRepository } from "../user/user.repository.js";
import {
    createRoomSchema,
    getMessagesSchema,
    getRoomsSchema,
    searchMessagesSchema,
    sendMessageSchema
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
