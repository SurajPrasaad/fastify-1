
export enum MessageType {
    TEXT = 'TEXT',
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    FILE = 'FILE',
    SYSTEM = 'SYSTEM'
}

export enum RoomType {
    DIRECT = 'DIRECT',
    GROUP = 'GROUP'
}

export enum PresenceStatus {
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE',
    AWAY = 'AWAY'
}

export interface IUser {
    id: string;
    username: string;
    name: string;
    avatarUrl?: string;
}

export interface IMessage {
    id: string;
    roomId: string;
    senderId: string;
    sender: IUser;
    content: string;
    type: MessageType;
    mediaUrl?: string;
    readBy: string[];
    createdAt: string;
    updatedAt: string;
    status: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
}

export interface IConversation {
    id: string;
    name?: string;
    type: RoomType;
    participants: IUser[];
    lastMessage?: IMessage;
    unreadCount: number;
    typingUsers: string[];
    createdAt: string;
    updatedAt: string;
}

export interface IUserPresence {
    userId: string;
    status: PresenceStatus;
    lastSeen: string;
}

export interface ChatState {
    conversations: IConversation[];
    activeRoomId: string | null;
    messagesByRoom: Record<string, IMessage[]>;
    presenceMap: Record<string, IUserPresence>;
    isLoading: {
        conversations: boolean;
        messages: boolean;
        rooms: boolean;
    };
    error: string | null;
}
