
import mongoose, { Schema, Document } from 'mongoose';

export enum MessageType {
    TEXT = 'TEXT',
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    FILE = 'FILE',
    SYSTEM = 'SYSTEM'
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

const MessageSchema = new Schema<IMessage>({
    roomId: { type: Schema.Types.ObjectId, ref: 'ChatRoom', required: true, index: true },
    senderId: { type: String, required: true, index: true },
    type: { type: String, enum: Object.values(MessageType), default: MessageType.TEXT },
    content: { type: String, required: true },
    mediaUrl: { type: String },
    metadata: { type: Map, of: Schema.Types.Mixed },
    isDeleted: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
}, { timestamps: true });

MessageSchema.index({ roomId: 1, createdAt: -1 });

export interface IChatRoom extends Document {
    name?: string;
    type: 'DIRECT' | 'GROUP';
    avatar?: string;
    participants: string[]; // Active user IDs
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

const ChatRoomSchema = new Schema<IChatRoom>({
    name: { type: String },
    type: { type: String, enum: ['DIRECT', 'GROUP'], default: 'DIRECT' },
    avatar: { type: String },
    participants: { type: [String], required: true, index: true },
    lastMessage: {
        senderId: String,
        content: String,
        type: { type: String, enum: Object.values(MessageType) },
        createdAt: Date,
    },
    metadata: { type: Map, of: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
export const ChatRoom = mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema);

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

const ParticipantStateSchema = new Schema<IParticipantState>({
    userId: { type: String, required: true, index: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'ChatRoom', required: true, index: true },
    lastReadAt: { type: Date, default: Date.now },
    lastSeenMessageId: { type: Schema.Types.ObjectId },
});

ParticipantStateSchema.index({ userId: 1, roomId: 1 }, { unique: true });

export const ParticipantState = mongoose.model<IParticipantState>('ParticipantState', ParticipantStateSchema);
