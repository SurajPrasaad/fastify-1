import type { FastifyInstance } from "fastify";
import { AuthRepository } from "./auth.repository.js";
import type { RegisterDto, LoginDto } from "./auth.dto.js";
export declare class AuthService {
    private readonly authRepository;
    private readonly fastify;
    private readonly privateKey;
    private readonly publicKey;
    constructor(authRepository: AuthRepository, fastify: FastifyInstance);
    googleLogin(idToken: string, deviceId: string, meta: {
        ip?: string;
        ua?: string;
    }): Promise<{
        user: any;
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
    register(data: RegisterDto, meta: {
        ip?: string;
        ua?: string;
    }): Promise<{
        user: {
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
        };
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
    sendVerificationEmail(user: {
        id: string;
        email: string;
    }): Promise<void>;
    verifyEmail(token: string): Promise<{
        message: string;
    }>;
    login(data: LoginDto, meta: {
        ip?: string;
        ua?: string;
    }): Promise<{
        mfaRequired: true;
        tempToken: string;
        user: {
            id: string;
            email: string;
            name: string;
        };
        tokens?: never;
    } | {
        user: {
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
        };
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
        mfaRequired: false;
        tempToken?: never;
    }>;
    getMe(userId: string): Promise<{
        id: string;
        username: string;
        email: string;
        name: string;
        bio: string | null;
        avatarUrl: string | null;
        profile: {
            techStack: string[] | null;
            followersCount: number;
            followingCount: number;
        };
        auth: {
            isEmailVerified: boolean;
            twoFactorEnabled: boolean;
            role: string;
            status: string;
            activeSessionsCount: number;
            lastLoginAt: Date;
        };
        connectedAccounts: {
            provider: "GOOGLE" | "GITHUB";
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    verify2FALogin(tempToken: string, code: string, deviceId: string, meta: {
        ip?: string;
        ua?: string;
    }): Promise<{
        user: {
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
        } | null;
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
    refresh(refreshToken: string, meta: {
        ip?: string;
        ua?: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(sessionId: string): Promise<void>;
    setup2FA(userId: string): Promise<{
        secret: string;
        qrCodeUrl: string;
    }>;
    verify2FA(userId: string, token: string): Promise<{
        message: string;
    }>;
    validate2FA(userId: string, token: string): Promise<boolean>;
    /**
     * Core Session Creation Logic
     */
    private createSession;
    getPublicKey(): string;
}
//# sourceMappingURL=auth.service.d.ts.map