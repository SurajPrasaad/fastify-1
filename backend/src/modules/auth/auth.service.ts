import type { FastifyInstance } from "fastify";
import { sendVerificationEmail } from "../../utils/email.js";
import { AuthRepository } from "./auth.repository.js";
import type { RegisterDto, LoginDto } from "./auth.dto.js";
import { AppError } from "../../utils/AppError.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { OAuth2Client } from "google-auth-library"; // Install google-auth-library


import { privateKey, publicKey } from "../../config/keys.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthService {
    // In production, fetch keys from Secrets Manager
    private readonly privateKey = privateKey;
    private readonly publicKey = publicKey;

    constructor(
        private readonly authRepository: AuthRepository,
        private readonly fastify: FastifyInstance
    ) { }

    async googleLogin(idToken: string, deviceId: string, meta: { ip?: string, ua?: string }) {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID!, // Assert exists or handle default
        });
        const payload = ticket.getPayload();
        if (!payload) {
            throw new AppError("Invalid Google Token", 400);
        }

        const { sub: providerId, email, name, picture } = payload;

        if (!email) {
            throw new AppError("Email not provided by Google", 400);
        }

        // 1. Check if user exists by Provider
        let user: any = await this.authRepository.findUserByProvider("GOOGLE", providerId);

        if (!user) {
            // 2. Check if user exists by Email
            const existingUser = await this.authRepository.findUserByEmail(email);
            if (existingUser) {
                // Link account if user exists but not linked
                await this.authRepository.addProviderToUser(existingUser.id, "GOOGLE", providerId);
                user = existingUser;
            } else {
                // 3. Create new user
                const username = `${(name || 'user').replace(/\s+/g, '').toLowerCase()}_${crypto.randomBytes(3).toString('hex')}`;
                // Cast picture to string | undefined
                user = await this.authRepository.createGoogleUser({
                    email,
                    name: name || "User",
                    username,
                    providerId,
                    ...(picture ? { picture } : {})
                });
            }
        }

        // 4. Create Session
        const tokens = await this.createSession(user.id, deviceId, meta);
        return { user, tokens };
    }

    async register(data: RegisterDto, meta: { ip?: string, ua?: string }) {
        const existingUser = await this.authRepository.findUserByEmail(data.email);
        if (existingUser) {
            throw new AppError("User already exists", 409);
        }

        const passwordHash = await bcrypt.hash(data.password, 10); // Upgrade to Argon2 in next iteration
        const user = await this.authRepository.createUser({ ...data, passwordHash });

        // Auto-login after register
        // For simplicity, we return user and let client call login, or we can generate a session here.
        // Let's create a session.
        const deviceId = `new_device_${crypto.randomBytes(4).toString('hex')}`; // Temporary device ID
        const tokens = await this.createSession(user.id, deviceId, meta);

        // Send Verification Email
        await this.sendVerificationEmail(user);

        return { user, tokens };
    }

    async sendVerificationEmail(user: { id: string, email: string }) {
        const token = jwt.sign(
            { sub: user.id, scope: 'email_verification' },
            this.privateKey,
            { algorithm: 'RS256', expiresIn: '24h' }
        );
        // Fire and forget or await? Await to ensure sending, or enqueue.
        // For now, fire and forget catch error to not block registration response if email fails
        sendVerificationEmail(user.email, token).catch(e => console.error("Failed to send verification email", e));
    }

    async verifyEmail(token: string) {
        let payload: { sub: string, scope: string };
        try {
            payload = jwt.verify(token, this.publicKey, { algorithms: ['RS256'] }) as { sub: string, scope: string };
        } catch (e) {
            throw new AppError("Invalid or expired verification token", 400);
        }

        if (payload.scope !== 'email_verification') {
            throw new AppError("Invalid token scope", 400);
        }

        const userId = payload.sub;
        await this.authRepository.markEmailAsVerified(userId);

        return { message: "Email verified successfully" };
    }

    async login(data: LoginDto, meta: { ip?: string, ua?: string }) {
        const user = await this.authRepository.findUserByEmail(data.email);
        if (!user) {
            throw new AppError("Invalid credentials", 401);
        }

        if (!user.password) {
            throw new AppError("Account uses external auth (Google/GitHub)", 400);
        }

        const isPasswordValid = await bcrypt.compare(data.password, user.password);
        if (!isPasswordValid) {
            throw new AppError("Invalid credentials", 401);
        }


        const mfaSecret = await this.authRepository.findMFASecret(user.id);
        if (mfaSecret && mfaSecret.isEnabled) {
            // Generate temporary token for 2FA verification
            const tempToken = jwt.sign(
                { sub: user.id, scope: '2fa_pending' },
                this.privateKey,
                { algorithm: 'RS256', expiresIn: '5m' }
            );
            return { mfaRequired: true as const, tempToken, user: { id: user.id, email: user.email, name: user.name } };
        }

        const tokens = await this.createSession(user.id, data.deviceId, meta);
        return { user, tokens, mfaRequired: false as const };
    }

    async getMe(userId: string) {
        // 1. Fetch User
        const user = await this.authRepository.findUserById(userId);
        if (!user) throw new AppError("User not found", 404);

        // 2. Fetch MFA Status
        const mfaSecret = await this.authRepository.findMFASecret(userId);
        const twoFactorEnabled = mfaSecret?.isEnabled || false;

        // 3. Fetch Session Count
        const activeSessionsCount = await this.authRepository.countActiveSessions(userId);

        // 4. Fetch Last Login
        const lastLoginAt = await this.authRepository.getLastLoginTime(userId);

        // 5. Fetch Identity Providers
        const identityProviders = await this.authRepository.findIdentityProviders(userId);
        const connectedAccounts = identityProviders.map(p => ({ provider: p.provider }));

        // 6. Construct Response
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            profile: {
                techStack: user.techStack,
                followersCount: user.followersCount,
                followingCount: user.followingCount,
            },
            auth: {
                isEmailVerified: user.isEmailVerified,
                twoFactorEnabled,
                role: "user", // Static for now
                status: "active", // Static for now or derive from user state 
                activeSessionsCount,
                lastLoginAt: lastLoginAt || user.createdAt, // Fallback to createdAt
            },
            connectedAccounts,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    async verify2FALogin(tempToken: string, code: string, deviceId: string, meta: { ip?: string, ua?: string }) {
        let payload: { sub: string, scope: string };
        try {
            payload = jwt.verify(tempToken, this.publicKey, { algorithms: ['RS256'] }) as { sub: string, scope: string };
        } catch (_e) {
            throw new AppError("Invalid or expired login token", 401);
        }

        if (payload.scope !== '2fa_pending') {
            throw new AppError("Invalid token scope", 401);
        }

        const userId = payload.sub;
        const valid = await this.validate2FA(userId, code);
        if (!valid) throw new AppError("Invalid OTP", 401);

        // Login successful
        const tokens = await this.createSession(userId, deviceId, meta);
        // Fetch user details for consistency 
        const user = await this.authRepository.findUserById(userId);

        return { user, tokens };
    }


    async refresh(refreshToken: string, meta: { ip?: string, ua?: string }) {
        // Refresh Token Format: "sessionId.randomToken"
        const [sessionId, tokenSecret] = refreshToken.split('.');
        if (!sessionId || !tokenSecret) {
            throw new AppError("Invalid token format", 401);
        }

        // 1. Verify Refresh Token Signature (Stateless check if signed, but here it's opaque structure)
        // We just lookup session by ID directly, but to be secure against enumeration, we should verify signature if we signed it.
        // Here we rely on the high-entropy randomToken being hash-checked.

        // 2. Lookup Session
        // findSessionByHash is not enough if we don't have the hash yet.
        // We need lookup by ID. Let's add findSessionById to repo, or just use `findSessionByHash` if we stored hash of whole token?
        // Current design: Store HASH of the `tokenSecret`. Session ID is public claim.

        const tokenHash = crypto.createHash('sha256').update(tokenSecret).digest('hex');

        // We need to find the session *first* to check if it's revoked or expired, 
        // BUT my repo only has `findSessionByHash`. 
        // Let's assume the repo can find by Hash. 
        // Note: Hash collision is negligible.
        const session = await this.authRepository.findSessionByHash(tokenHash);

        if (!session) {
            // Potential Reuse Detection: 
            // If we can't find it, maybe it was rotated already?
            // Advanced: Log this event as potential theft.
            throw new AppError("Invalid or expired session", 401);
        }

        if (!session.isValid || new Date() > session.expiresAt) {
            throw new AppError("Session expired", 401);
        }

        // 3. Rotate Token
        // Revoke old hash (by replacing it)
        const newTokens = await this.createSession(session.userId, session.deviceId, meta, session.id);

        // Ideally we update the existing session record rather than creating new one, 
        // but for immutable logs we might create new. 
        // Let's UPDATE the existing session with new hash and expiry.
        // My repo `createSession` INSERTS. I need `updateSession`.
        // I will implement a `rotateSession` logic here by revoking old and creating new, 
        // or asking Repo to update. 

        // For now, to suffice functionality: Delete old, create new.
        await this.authRepository.revokeSession(session.id);

        return newTokens;
    }

    async logout(sessionId: string) {
        await this.authRepository.revokeSession(sessionId);
    }

    async setup2FA(userId: string) {
        const secret = speakeasy.generateSecret({ name: "FastifyApp" });
        // Save secret but do NOT enable yet
        await this.authRepository.createMFASecret(userId, secret.base32, []);

        // Generate QR Code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
        return { secret: secret.base32, qrCodeUrl };
    }

    async verify2FA(userId: string, token: string) {
        const record = await this.authRepository.findMFASecret(userId);
        if (!record) throw new AppError("MFA not set up", 400);

        const verified = speakeasy.totp.verify({
            secret: record.secret,
            encoding: 'base32',
            token
        });

        if (!verified) throw new AppError("Invalid MFA token", 401);

        await this.authRepository.enableMFA(userId);
        return { message: "MFA enabled successfully" };
    }

    async validate2FA(userId: string, token: string) {
        const record = await this.authRepository.findMFASecret(userId);
        if (!record || !record.isEnabled) throw new AppError("MFA not enabled", 400);

        const verified = speakeasy.totp.verify({
            secret: record.secret,
            encoding: 'base32',
            token // The user-provided 6-digit code
        });

        if (!verified) throw new AppError("Invalid MFA token", 401);

        return true;
    }

    /**
     * Core Session Creation Logic
     */
    private async createSession(userId: string, deviceId: string, meta: { ip?: string, ua?: string }, existingSessionId?: string) {
        const tokenSecret = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(tokenSecret).digest('hex');

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 Days

        // Calling repository with robust optional handling
        const session = await this.authRepository.createSession({
            userId,
            refreshTokenHash: tokenHash,
            deviceId,
            expiresAt,
            ...(meta.ip ? { ip: meta.ip } : {}),
            ...(meta.ua ? { ua: meta.ua } : {})
        });

        if (!session) {
            throw new AppError("Failed to create session", 500);
        }

        // Generate Stateless Access Token (RS256)
        const accessToken = jwt.sign(
            {
                sub: userId,
                sid: session.id, // Bind to session
                role: 'user' // Fetch role if needed
            },
            this.privateKey,
            {
                algorithm: 'RS256',
                expiresIn: '15m',
                issuer: 'auth-service',
                audience: 'api'
            }
        );

        // Opaque Refresh Token: sessionId + "." + secret
        const refreshToken = `${session.id}.${tokenSecret}`;

        return { accessToken, refreshToken };
    }

    // Public Key for JWKS
    getPublicKey() {
        return this.publicKey;
    }
}
