import { z } from "zod";
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
    username: z.ZodString;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    deviceId: z.ZodString;
}, z.core.$strip>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, z.core.$strip>;
export declare const verify2FASchema: z.ZodObject<{
    token: z.ZodString;
}, z.core.$strip>;
export declare const verify2FALoginSchema: z.ZodObject<{
    tempToken: z.ZodString;
    code: z.ZodString;
    deviceId: z.ZodString;
}, z.core.$strip>;
export declare const verifyEmailSchema: z.ZodObject<{
    token: z.ZodString;
}, z.core.$strip>;
export type Verify2FAInput = z.infer<typeof verify2FASchema>;
export type Verify2FALoginInput = z.infer<typeof verify2FALoginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export declare const userResponseSchema: z.ZodObject<{
    id: z.ZodString;
    username: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    profile: z.ZodObject<{
        techStack: z.ZodNullable<z.ZodArray<z.ZodString>>;
        followersCount: z.ZodNumber;
        followingCount: z.ZodNumber;
    }, z.core.$strip>;
    auth: z.ZodObject<{
        isEmailVerified: z.ZodBoolean;
        twoFactorEnabled: z.ZodBoolean;
        role: z.ZodDefault<z.ZodString>;
        status: z.ZodDefault<z.ZodString>;
        activeSessionsCount: z.ZodNumber;
        lastLoginAt: z.ZodOptional<z.ZodDate>;
    }, z.core.$strip>;
    connectedAccounts: z.ZodArray<z.ZodObject<{
        provider: z.ZodString;
    }, z.core.$strip>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export declare const googleLoginSchema: z.ZodObject<{
    idToken: z.ZodString;
    deviceId: z.ZodString;
}, z.core.$strip>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
//# sourceMappingURL=auth.schema.d.ts.map