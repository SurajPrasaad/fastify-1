export interface BlockStatus {
    isBlocked: boolean;
    isBlockedBy: boolean;
}

export interface BlockedUser {
    id: string;
    username: string;
    name: string;
    avatarUrl?: string | null;
    blockedAt: string;
}

export interface BlockResponse {
    success: boolean;
}
