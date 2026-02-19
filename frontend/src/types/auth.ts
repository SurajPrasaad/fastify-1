export interface UserProfile {
    techStack: string[] | null;
    followersCount: number;
    followingCount: number;
    postsCount: number;
}

export interface UserAuth {
    isEmailVerified: boolean;
    twoFactorEnabled: boolean;
    role: string;
    status: string;
    activeSessionsCount: number;
    lastLoginAt?: string;
}

export interface ConnectedAccount {
    provider: string;
}

export interface UserResponse {
    id: string;
    username: string;
    email: string;
    name: string;
    bio: string | null;
    avatarUrl: string | null;
    profile: UserProfile;
    auth: UserAuth;
    connectedAccounts: ConnectedAccount[];
    createdAt: string;
    updatedAt: string;
}

export interface AuthTokens {
    accessToken: string;
}

export interface LoginResponse {
    message: string;
    accessToken: string;
    user: {
        id: string;
        email: string;
        name: string;
        username: string;
        avatarUrl: string | null;
    };
    mfaRequired?: boolean;
    tempToken?: string;
    userId?: string;
}

export interface RegisterResponse {
    message: string;
    accessToken: string;
    user: {
        id: string;
        email: string;
        name: string;
        username: string;
        avatarUrl: string | null;
    };
}
