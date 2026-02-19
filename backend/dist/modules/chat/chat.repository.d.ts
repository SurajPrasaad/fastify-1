import { MessageType } from "./chat.model.js";
import mongoose from "mongoose";
export declare class ChatRepository {
    findOrCreateDirectRoom(user1: string, user2: string): Promise<mongoose.Document<unknown, {}, import("./chat.model.js").IChatRoom, {}, mongoose.DefaultSchemaOptions> & import("./chat.model.js").IChatRoom & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    createGroupRoom(name: string, participants: string[], creatorId: string): Promise<mongoose.Document<unknown, {}, import("./chat.model.js").IChatRoom, {}, mongoose.DefaultSchemaOptions> & import("./chat.model.js").IChatRoom & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    findRoomById(roomId: string): Promise<(mongoose.Document<unknown, {}, import("./chat.model.js").IChatRoom, {}, mongoose.DefaultSchemaOptions> & import("./chat.model.js").IChatRoom & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    findUserRooms(userId: string, limit: number, offset: number): Promise<(mongoose.Document<unknown, {}, import("./chat.model.js").IChatRoom, {}, mongoose.DefaultSchemaOptions> & import("./chat.model.js").IChatRoom & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    saveMessage(data: {
        roomId: string;
        senderId: string;
        content: string;
        type?: MessageType | undefined;
        mediaUrl?: string | undefined;
    }): Promise<mongoose.Document<unknown, {}, import("./chat.model.js").IMessage, {}, mongoose.DefaultSchemaOptions> & import("./chat.model.js").IMessage & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    getRoomMessages(roomId: string, limit: number, before?: string): Promise<(mongoose.Document<unknown, {}, import("./chat.model.js").IMessage, {}, mongoose.DefaultSchemaOptions> & import("./chat.model.js").IMessage & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[]>;
    updateReadState(userId: string, roomId: string, messageId: string): Promise<mongoose.Document<unknown, {}, import("./chat.model.js").IParticipantState, {}, mongoose.DefaultSchemaOptions> & import("./chat.model.js").IParticipantState & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
//# sourceMappingURL=chat.repository.d.ts.map