import { z } from "zod";
export const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[0-9]/, "Password must contain at least one number"),
    name: z.string().min(2),
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
});
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
    deviceId: z.string().min(1, "Device ID is required"),
});
export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(10), // Allow JWT or custom format
});
export const verify2FASchema = z.object({
    token: z.string().length(6, "Token must be 6 digits"),
});
export const verify2FALoginSchema = z.object({
    tempToken: z.string().min(10, "Temporary token required"),
    code: z.string().length(6, "Code must be 6 digits"),
    deviceId: z.string().min(1, "Device ID is required"),
});
export const verifyEmailSchema = z.object({
    token: z.string().min(1, "Token is required"),
});
export const userResponseSchema = z.object({
    id: z.string(),
    username: z.string(),
    email: z.string(),
    name: z.string(),
    profile: z.object({
        techStack: z.array(z.string()).nullable(),
        followersCount: z.number(),
        followingCount: z.number(),
    }),
    auth: z.object({
        isEmailVerified: z.boolean(),
        twoFactorEnabled: z.boolean(),
        role: z.string().default("user"), // Static for now as role not in user table
        status: z.string().default("active"), // Static for now
        activeSessionsCount: z.number(),
        lastLoginAt: z.date().optional(),
    }),
    connectedAccounts: z.array(z.object({
        provider: z.string(),
    })),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const googleLoginSchema = z.object({
    idToken: z.string().min(1, "Google ID Token is required"),
    deviceId: z.string().min(1, "Device ID is required"),
});
//# sourceMappingURL=auth.schema.js.map