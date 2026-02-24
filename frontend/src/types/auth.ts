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
    status: "ACTIVE" | "DEACTIVATED" | "SUSPENDED" | "DELETED";
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
    coverUrl: string | null;
    website: string | null;
    location: string | null;
    phoneNumber: string | null;
    subscriptionPlan: "FREE" | "PREMIUM" | "PREMIUM_PRO";
    passwordChangedAt: string | null;
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
    user: UserResponse;
    mfaRequired?: boolean;
    tempToken?: string;
    userId?: string;
}

export interface RegisterResponse {
    message: string;
    accessToken: string;
    user: UserResponse;
}
