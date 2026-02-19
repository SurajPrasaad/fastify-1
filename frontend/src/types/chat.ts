export enum MessageType {
    TEXT = 'TEXT',
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    FILE = 'FILE',
    SYSTEM = 'SYSTEM'
}

export interface ChatParticipant {
    id: string; // Postgres ID
    username: string;
    name: string;
    avatarUrl?: string;
}

export type MessageStatus = 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'ERROR';

export interface ChatMessage {
    _id: string;
    roomId: string;
    senderId: string;
    content: string;
    type: MessageType;
    mediaUrl?: string;
    isDeleted: boolean;
    isEdited: boolean;
    status: MessageStatus;
    createdAt: string;
    updatedAt: string;
}

export interface ChatRoom {
    _id: string;
    name?: string;
    type: 'DIRECT' | 'GROUP';
    participants: ChatParticipant[];
    lastMessage?: {
        senderId: string;
        content: string;
        type: MessageType;
        createdAt: string;
    };
    createdAt: string;
    updatedAt: string;
}

// WebSocket Event Types
export type ChatEventType =
    | 'JOIN_ROOM'
    | 'SEND_MESSAGE'
    | 'TYPING'
    | 'STOP_TYPING'
    | 'READ_RECEPT'
    | 'NEW_MESSAGE'
    | 'USER_TYPING'
    | 'USER_STOPPED_TYPING'
    | 'USER_ONLINE'
    | 'USER_OFFLINE';

export interface ChatEvent {
    type: ChatEventType;
    payload: any;
}

export interface CreateRoomDto {
    participants: string[];
    type?: 'DIRECT' | 'GROUP';
    name?: string;
}

export interface SearchMessagesParams {
    q: string;
    limit?: number;
    offset?: number;
}

export interface UserPresence {
    userId: string;
    status: 'ONLINE' | 'OFFLINE';
    lastSeen?: string;
}
