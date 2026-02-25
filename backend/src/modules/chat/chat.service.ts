
import { ChatRepository } from "./chat.repository.js";
import { UserRepository } from "../user/user.repository.js";
import { redis } from "../../config/redis.js";
import { AppError } from "../../utils/AppError.js";
import { MessageType } from "./chat.model.js";
import type { IChatRoom, IMessage } from "./chat.model.js";

export interface PopulatedParticipant {
    _id: string;
    id: string;
    username: string;
    name?: string;
    avatarUrl?: string | null;
}

export interface PopulatedConversation {
    _id: any;
    name?: string;
    type: 'DIRECT' | 'GROUP';
    avatar?: string;
    participants: PopulatedParticipant[];
    lastMessage?: {
        senderId: string;
        content: string;
        type: MessageType;
        createdAt: Date;
    };
    metadata?: Record<string, any>;
    unreadCount?: number;
    createdAt?: Date;
    updatedAt?: Date;
}



export class ChatService {
    constructor(
        private repository: ChatRepository,
        private userRepository: UserRepository
    ) { }

    async getUserPresence(userId: string): Promise<{ userId: string; status: string; lastSeen: Date | null }> {
        const presence = await redis.hgetall(`presence:u:${userId}`);
        return {
            userId,
            status: presence?.status || 'OFFLINE',
            lastSeen: presence?.lastSeen ? new Date(parseInt(presence.lastSeen)) : null
        };
    }

    async setUserPresence(userId: string, status: 'ONLINE' | 'OFFLINE') {
        const timestamp = Date.now().toString();
        if (status === 'ONLINE') {
            await redis.hset(`presence:u:${userId}`, {
                status: 'ONLINE',
                lastHeartbeat: timestamp,
                lastSeen: timestamp
            });
            await redis.expire(`presence:u:${userId}`, 90);
        } else {
            await redis.hset(`presence:u:${userId}`, {
                status: 'OFFLINE',
                lastSeen: timestamp
            });
            await redis.zrem(`presence:v_heartbeat`, userId);
        }
    }

    async getHistory(roomId: string, userId: string, limit: number, before?: string): Promise<IMessage[]> {
        const room = await this.repository.findRoomById(roomId);
        if (!room || !room.participants.includes(userId)) {
            throw new AppError("Room not found or access denied", 403);
        }

        return await this.repository.getRoomMessages(roomId, limit, before);
    }

    async getConversations(userId: string, limit: number, offset: number): Promise<PopulatedConversation[]> {
        const rooms = await this.repository.findUserRooms(userId, limit, offset);

        // Collect all unique participant IDs across all rooms
        const participantIds = new Set<string>();
        rooms.forEach(room => {
            room.participants.forEach(p => participantIds.add(p));
        });

        if (participantIds.size === 0) return [];

        // Fetch user details from Postgres
        const users = await this.userRepository.findByIds(Array.from(participantIds));
        const userMap = new Map(users.map(u => [u.id, u]));

        // Populate participants and unread count in each room
        return await Promise.all(rooms.map(async room => {
            const roomObj = room.toObject ? room.toObject() : room;
            const unreadCount = await this.repository.getUnreadCount(userId, roomObj._id.toString());

            return {
                ...roomObj,
                unreadCount,
                participants: roomObj.participants.map((pid: string) => {
                    const user = userMap.get(pid);
                    if (user) {
                        return {
                            _id: user.id, // Map Postgres ID to _id for consistency with Monogo-style frontend expectation
                            id: user.id,
                            username: user.username,
                            name: user.name,
                            avatarUrl: user.avatarUrl
                        };
                    }
                    return { _id: pid, id: pid, username: 'Unknown User' };
                })
            } as unknown as PopulatedConversation;
        }));
    }

    async createRoom(creatorId: string, participants: string[], type: 'DIRECT' | 'GROUP', name?: string) {
        if (type === 'DIRECT') {
            const recipientId = participants[0];
            if (!recipientId || participants.length !== 1) {
                throw new AppError("Direct chat requires exactly 1 participant", 400);
            }
            return await this.repository.findOrCreateDirectRoom(creatorId, recipientId);
        }

        return await this.repository.createGroupRoom(name || "New Group", participants, creatorId);
    }

    async sendMessage(senderId: string, roomId: string, content: string, type: MessageType = MessageType.TEXT, mediaUrl?: string): Promise<IMessage> {
        const room = await this.repository.findRoomById(roomId);
        if (!room || !room.participants.includes(senderId)) {
            throw new AppError("Access denied or room invalid", 403);
        }

        const message = await this.repository.saveMessage({
            roomId,
            senderId,
            content,
            type,
            mediaUrl
        });

        // Broadcast via Redis
        const event = { type: 'NEW_MESSAGE', payload: message };
        room.participants.forEach(pId => {
            redis.publish(`chat:u:${pId}`, JSON.stringify(event));
        });

        return message;
    }

    async markAsRead(userId: string, roomId: string, messageId?: string) {
        if (!messageId) {
            // Find the latest message in the room to mark as read up to
            const [latestMsg] = await this.repository.getRoomMessages(roomId, 1);
            if (latestMsg) {
                messageId = latestMsg._id.toString();
            } else {
                // If no messages, just update lastReadAt
                return await this.repository.updateReadState(userId, roomId);
            }
        }
        return await this.repository.updateReadState(userId, roomId, messageId);
    }

    async searchMessages(userId: string, query: string, limit: number, offset: number) {
        return await this.repository.searchMessages(userId, query, limit, offset);
    }

    async clearHistory(userId: string) {
        return await this.repository.clearHistory(userId);
    }

    async deleteAllRooms(userId: string) {
        return await this.repository.deleteAllRooms(userId);
    }
}
