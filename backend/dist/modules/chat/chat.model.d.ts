import mongoose, { Document } from 'mongoose';
export declare enum MessageType {
    TEXT = "TEXT",
    IMAGE = "IMAGE",
    VIDEO = "VIDEO",
    FILE = "FILE",
    SYSTEM = "SYSTEM"
}
export interface IMessage extends Document {
    roomId: mongoose.Types.ObjectId;
    senderId: string;
    type: MessageType;
    content: string;
    mediaUrl?: string;
    metadata?: Record<string, any>;
    isDeleted: boolean;
    isEdited: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface IChatRoom extends Document {
    name?: string;
    type: 'DIRECT' | 'GROUP';
    avatar?: string;
    participants: string[];
    lastMessage?: {
        senderId: string;
        content: string;
        type: MessageType;
        createdAt: Date;
    };
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Message: mongoose.Model<IMessage, {}, {}, {}, mongoose.Document<unknown, {}, IMessage, {}, mongoose.DefaultSchemaOptions> & IMessage & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IMessage>;
export declare const ChatRoom: mongoose.Model<IChatRoom, {}, {}, {}, mongoose.Document<unknown, {}, IChatRoom, {}, mongoose.DefaultSchemaOptions> & IChatRoom & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IChatRoom>;
/**
 * Participant Read State
 * Tracks the last read message timestamp/ID for each user in each room.
 */
export interface IParticipantState extends Document {
    userId: string;
    roomId: mongoose.Types.ObjectId;
    lastReadAt: Date;
    lastSeenMessageId?: mongoose.Types.ObjectId;
}
export declare const ParticipantState: mongoose.Model<IParticipantState, {}, {}, {}, mongoose.Document<unknown, {}, IParticipantState, {}, mongoose.DefaultSchemaOptions> & IParticipantState & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IParticipantState>;
//# sourceMappingURL=chat.model.d.ts.map