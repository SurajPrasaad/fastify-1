import mongoose, { Schema, Document } from 'mongoose';
export var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "TEXT";
    MessageType["IMAGE"] = "IMAGE";
    MessageType["VIDEO"] = "VIDEO";
    MessageType["FILE"] = "FILE";
    MessageType["SYSTEM"] = "SYSTEM";
})(MessageType || (MessageType = {}));
const MessageSchema = new Schema({
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
const ChatRoomSchema = new Schema({
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
export const Message = mongoose.model('Message', MessageSchema);
export const ChatRoom = mongoose.model('ChatRoom', ChatRoomSchema);
const ParticipantStateSchema = new Schema({
    userId: { type: String, required: true, index: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'ChatRoom', required: true, index: true },
    lastReadAt: { type: Date, default: Date.now },
    lastSeenMessageId: { type: Schema.Types.ObjectId },
});
ParticipantStateSchema.index({ userId: 1, roomId: 1 }, { unique: true });
export const ParticipantState = mongoose.model('ParticipantState', ParticipantStateSchema);
//# sourceMappingURL=chat.model.js.map