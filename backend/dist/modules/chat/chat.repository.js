import { Message, ChatRoom, ParticipantState, MessageType } from "./chat.model.js";
import mongoose from "mongoose";
export class ChatRepository {
    async findOrCreateDirectRoom(user1, user2) {
        const participants = [user1, user2].sort();
        let room = await ChatRoom.findOne({
            type: 'DIRECT',
            participants: { $all: participants, $size: 2 }
        });
        if (!room) {
            room = await ChatRoom.create({
                participants,
                type: 'DIRECT'
            });
        }
        return room;
    }
    async createGroupRoom(name, participants, creatorId) {
        return await ChatRoom.create({
            name,
            participants: [...new Set([...participants, creatorId])],
            type: 'GROUP'
        });
    }
    async findRoomById(roomId) {
        if (!mongoose.Types.ObjectId.isValid(roomId))
            return null;
        return await ChatRoom.findById(roomId);
    }
    async findUserRooms(userId, limit, offset) {
        return await ChatRoom.find({ participants: userId })
            .sort({ updatedAt: -1 })
            .skip(offset)
            .limit(limit);
    }
    async saveMessage(data) {
        const msgData = {
            roomId: new mongoose.Types.ObjectId(data.roomId),
            senderId: data.senderId,
            content: data.content,
            type: data.type || MessageType.TEXT
        };
        if (data.mediaUrl) {
            msgData.mediaUrl = data.mediaUrl;
        }
        const msg = await Message.create(msgData);
        // Background: update room last message
        ChatRoom.findByIdAndUpdate(data.roomId, {
            lastMessage: {
                senderId: data.senderId,
                content: data.content,
                type: data.type || MessageType.TEXT,
                createdAt: msg.createdAt
            }
        }).exec();
        return msg;
    }
    async getRoomMessages(roomId, limit, before) {
        const query = { roomId: new mongoose.Types.ObjectId(roomId), isDeleted: false };
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }
        return await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(limit);
    }
    async updateReadState(userId, roomId, messageId) {
        return await ParticipantState.findOneAndUpdate({ userId, roomId: new mongoose.Types.ObjectId(roomId) }, {
            lastReadAt: new Date(),
            lastSeenMessageId: new mongoose.Types.ObjectId(messageId)
        }, { upsert: true, new: true });
    }
}
//# sourceMappingURL=chat.repository.js.map