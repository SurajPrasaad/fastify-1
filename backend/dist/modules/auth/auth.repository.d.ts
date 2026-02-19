import type { RegisterDto } from "./auth.dto.js";
export declare class AuthRepository {
    createUser(data: RegisterDto & {
        passwordHash: string;
    }): Promise<{
        followersCount: number;
        followingCount: number;
        postsCount: number;
        id: string;
        name: string;
        username: string;
        email: string;
        bio: string | null;
        avatarUrl: string | null;
        password: string | null;
        isEmailVerified: boolean;
        tokenVersion: number;
        status: "ACTIVE" | "DEACTIVATED" | "SUSPENDED" | "DELETED";
        regionAffinity: string | null;
        techStack: string[] | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findUserByEmail(email: string): Promise<{
        followersCount: number;
        followingCount: number;
        postsCount: number;
        id: string;
        username: string;
        email: string;
        name: string;
        bio: string | null;
        avatarUrl: string | null;
        password: string | null;
        isEmailVerified: boolean;
        tokenVersion: number;
        status: "ACTIVE" | "DEACTIVATED" | "SUSPENDED" | "DELETED";
        regionAffinity: string | null;
        techStack: string[] | null;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    findUserById(id: string): Promise<{
        followersCount: number;
        followingCount: number;
        postsCount: number;
        id: string;
        username: string;
        email: string;
        name: string;
        bio: string | null;
        avatarUrl: string | null;
        password: string | null;
        isEmailVerified: boolean;
        tokenVersion: number;
        status: "ACTIVE" | "DEACTIVATED" | "SUSPENDED" | "DELETED";
        regionAffinity: string | null;
        techStack: string[] | null;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    createSession(data: {
        userId: string;
        refreshTokenHash: string;
        deviceId: string;
        ip?: string;
        ua?: string;
        expiresAt: Date;
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        refreshTokenHash: string;
        deviceId: string;
        ipAddress: string | null;
        userAgent: string | null;
        isValid: boolean;
        expiresAt: Date;
        lastActiveAt: Date;
    } | undefined>;
    findSessionByHash(refreshTokenHash: string): Promise<{
        id: string;
        userId: string;
        refreshTokenHash: string;
        deviceId: string;
        ipAddress: string | null;
        userAgent: string | null;
        isValid: boolean;
        expiresAt: Date;
        createdAt: Date;
        lastActiveAt: Date;
    } | undefined>;
    revokeSession(sessionId: string): Promise<void>;
    revokeAllUserSessions(userId: string): Promise<void>;
    createMFASecret(userId: string, secret: string, backupCodes: string[]): Promise<void>;
    findMFASecret(userId: string): Promise<{
        userId: string;
        secret: string;
        backupCodes: string[] | null;
        isEnabled: boolean;
        createdAt: Date;
    } | undefined>;
    enableMFA(userId: string): Promise<void>;
    deleteMFASecret(userId: string): Promise<void>;
    countActiveSessions(userId: string): Promise<number>;
    getLastLoginTime(userId: string): Promise<Date | undefined>;
    findIdentityProviders(userId: string): Promise<{
        provider: "GOOGLE" | "GITHUB";
    }[]>;
    markEmailAsVerified(userId: string): Promise<void>;
    findUserByProvider(provider: "GOOGLE", providerId: string): Promise<{
        followersCount: number;
        followingCount: number;
        postsCount: number;
        id: string;
        username: string;
        email: string;
        name: string;
        bio: string | null;
        avatarUrl: string | null;
        password: string | null;
        isEmailVerified: boolean;
        tokenVersion: number;
        status: "ACTIVE" | "DEACTIVATED" | "SUSPENDED" | "DELETED";
        regionAffinity: string | null;
        techStack: string[] | null;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    createGoogleUser(data: {
        email: string;
        name: string;
        username: string;
        providerId: string;
        picture?: string;
    }): Promise<{
        followersCount: number;
        followingCount: number;
        postsCount: number;
        id: string;
        name: string;
        username: string;
        email: string;
        bio: string | null;
        avatarUrl: string | null;
        password: string | null;
        isEmailVerified: boolean;
        tokenVersion: number;
        status: "ACTIVE" | "DEACTIVATED" | "SUSPENDED" | "DELETED";
        regionAffinity: string | null;
        techStack: string[] | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    addProviderToUser(userId: string, provider: "GOOGLE", providerId: string): Promise<void>;
}
//# sourceMappingURL=auth.repository.d.ts.map