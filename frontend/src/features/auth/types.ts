export interface UserProfile {
    techStack: string[] | null;
    followersCount: number;
    followingCount: number;
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

export interface User {
    id: string;
    username: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
    bio?: string | null;
    profile: UserProfile;
    auth: UserAuth;
    connectedAccounts: ConnectedAccount[];
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken?: string;
    mfaRequired?: boolean;
    tempToken?: string;
}

export interface LoginResponse extends AuthResponse { }
export interface RegisterResponse extends AuthResponse { }

export interface ApiError {
    message: string;
    code?: string;
    status: number;
    fields?: Record<string, string>;
}
