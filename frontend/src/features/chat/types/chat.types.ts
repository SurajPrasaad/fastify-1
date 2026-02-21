
export enum RoomType {
    DIRECT = 'DIRECT',
    GROUP = 'GROUP'
}

export enum PresenceStatus {
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE',
    AWAY = 'AWAY'
}

export interface IUserPresence {
    userId: string;
    status: PresenceStatus;
    lastSeen: string;
}

export enum MessageType {
    TEXT = 'TEXT',
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    FILE = 'FILE',
    SYSTEM = 'SYSTEM',
    AUDIO = 'AUDIO',
    LOCATION = 'LOCATION'
}

export enum MessageStatus {
    SENDING = 'sending',
    SENT = 'sent',
    DELIVERED = 'delivered',
    READ = 'read',
    ERROR = 'error'
}

export interface IAttachment {
    id: string;
    type: MessageType;
    url: string;
    thumbnailUrl?: string;
    name: string;
    size: number;
    mimeType: string;
    width?: number;
    height?: number;
    duration?: number;
}

export interface IReaction {
    emoji: string;
    userId: string;
    count: number;
}

export interface IMessage {
    id: string;
    tempId?: string;
    conversationId: string;
    senderId: string;
    sender: {
        id: string;
        name: string;
        avatarUrl?: string;
        username: string;
    };
    content: string;
    type: MessageType;
    attachments?: IAttachment[];
    reactions?: IReaction[];
    replyTo?: {
        id: string;
        content: string;
        senderName: string;
        type: MessageType;
    };
    isForwarded?: boolean;
    isEdited?: boolean;
    status: MessageStatus;
    createdAt: string;
    updatedAt: string;
}

export interface IConversation {
    id: string;
    name?: string;
    isGroup: boolean;
    participants: {
        id: string;
        name: string;
        avatarUrl?: string;
        isOnline: boolean;
        lastSeen?: string;
    }[];
    lastMessage?: IMessage;
    unreadCount: number;
    typingUsers: string[]; // User IDs
    createdAt: string;
    updatedAt: string;
}

export interface ChatState {
    activeConversationId: string | null;
    conversations: Record<string, IConversation>;
    messages: Record<string, IMessage[]>;
    cursorByConversation: Record<string, string | null>;
    hasMoreByConversation: Record<string, boolean>;
    onlineUsers: Set<string>;
    sendingQueue: string[]; // tempIds
    unreadCounts: Record<string, number>;
}

export type ChatEvent =
    | { type: 'NEW_MESSAGE'; payload: IMessage }
    | { type: 'MESSAGE_UPDATED'; payload: Partial<IMessage> & { id: string } }
    | { type: 'MESSAGE_STATUS'; payload: { messageId: string; status: MessageStatus; conversationId: string } }
    | { type: 'TYPING_STATUS'; payload: { conversationId: string; userId: string; isTyping: boolean } }
    | { type: 'USER_PRESENCE'; payload: { userId: string; isOnline: boolean; lastSeen?: string } }
    | { type: 'CONVERSATION_UPDATE'; payload: Partial<IConversation> & { id: string } }
    | { type: 'MESSAGE_REACTION'; payload: { messageId: string; emoji: string; userId: string; action: 'add' | 'remove' } };
