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

export interface IMessage {
    id: string;
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
    typingUsers: string[];
    createdAt: string;
    updatedAt: string;
}

export type ChatEvent =
    | { type: 'NEW_MESSAGE'; payload: IMessage }
    | { type: 'MESSAGE_UPDATED'; payload: Partial<IMessage> & { id: string } }
    | { type: 'TYPING_STATUS'; payload: { conversationId: string; userId: string; isTyping: boolean } }
    | { type: 'USER_PRESENCE'; payload: { userId: string; isOnline: boolean; lastSeen?: string } }
    | { type: 'CONVERSATION_UPDATE'; payload: Partial<IConversation> & { id: string } };
