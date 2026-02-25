
import { Message, ChatRoom, ParticipantState, MessageType } from "./chat.model.js";
import mongoose from "mongoose";

export class ChatRepository {
    async findOrCreateDirectRoom(user1: string, user2: string) {
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

    async createGroupRoom(name: string, participants: string[], creatorId: string) {
        return await ChatRoom.create({
            name,
            participants: [...new Set([...participants, creatorId])],
            type: 'GROUP'
        });
    }

    async findRoomById(roomId: string) {
        if (!mongoose.Types.ObjectId.isValid(roomId)) return null;
        return await ChatRoom.findById(roomId);
    }

    async findUserRooms(userId: string, limit: number, offset: number) {
        return await ChatRoom.find({ participants: userId })
            .sort({ updatedAt: -1 })
            .skip(offset)
            .limit(limit);
    }

    async saveMessage(data: {
        roomId: string;
        senderId: string;
        content: string;
        type?: MessageType | undefined;
        mediaUrl?: string | undefined;
    }) {
        const msgData: any = {
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

    async getRoomMessages(roomId: string, limit: number, before?: string) {
        const query: any = { roomId: new mongoose.Types.ObjectId(roomId), isDeleted: false };
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        return await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(limit);
    }

    async updateReadState(userId: string, roomId: string, messageId?: string) {
        const update: any = { lastReadAt: new Date() };
        if (messageId && mongoose.Types.ObjectId.isValid(messageId)) {
            update.lastSeenMessageId = new mongoose.Types.ObjectId(messageId);
        }

        return await ParticipantState.findOneAndUpdate(
            { userId, roomId: new mongoose.Types.ObjectId(roomId) },
            update,
            { upsert: true, new: true }
        );
    }

    async getUnreadCount(userId: string, roomId: string): Promise<number> {
        const state = await ParticipantState.findOne({ userId, roomId: new mongoose.Types.ObjectId(roomId) });
        const query: any = {
            roomId: new mongoose.Types.ObjectId(roomId),
            senderId: { $ne: userId },
            isDeleted: false
        };

        if (state) {
            query.createdAt = { $gt: state.lastReadAt };
        }

        return await Message.countDocuments(query);
    }

    async searchMessages(userId: string, query: string, limit: number, offset: number) {
        // Find all rooms where user is a participant
        const rooms = await ChatRoom.find({ participants: userId }).select('_id');
        const roomIds = rooms.map(room => room._id);

        return await Message.find({
            roomId: { $in: roomIds },
            content: { $regex: query, $options: 'i' },
            isDeleted: false
        })
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .populate('roomId', 'name type participants'); // Populate minimal room info
    }

    async clearHistory(userId: string) {
        // Find all rooms where user is a participant
        const rooms = await ChatRoom.find({ participants: userId }).select('_id');
        const roomIds = rooms.map(room => room._id);

        return await Message.updateMany(
            { roomId: { $in: roomIds } },
            { $set: { isDeleted: true } }
        );
    }

    async deleteAllRooms(userId: string) {
        // Hard delete user's rooms or clear their participant status
        // For simplicity, let's remove the user from participants or delete if they are the only ones left
        const rooms = await ChatRoom.find({ participants: userId });
        for (const room of rooms) {
            room.participants = room.participants.filter(p => p !== userId);
            if (room.participants.length === 0) {
                await Message.deleteMany({ roomId: room._id });
                await ChatRoom.deleteOne({ _id: room._id });
            } else {
                await room.save();
            }
        }
    }
}
