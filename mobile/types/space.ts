export type RoomRole = 'HOST' | 'SPEAKER' | 'LISTENER';

export interface Participant {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string | null;
    role: RoomRole;
    isSpeaking?: boolean;
    isMuted?: boolean;
}

export interface SpaceRoom {
    id: string;
    title: string;
    hostId: string;
    status: 'ACTIVE' | 'ENDED';
    createdAt: string;
    host: {
        id: string;
        username: string;
        name: string;
        avatarUrl?: string | null;
    };
    participants?: {
        role: RoomRole;
        user: {
            id: string;
            username: string;
            name: string;
            avatarUrl?: string | null;
        }
    }[];
}

export interface GetActiveRoomsResponse {
    rooms: SpaceRoom[];
    nextCursor?: string;
}
