import type { RegisterInput, LoginInput, RefreshTokenInput, GoogleLoginInput } from "./auth.schema.js";
export type GoogleLoginDto = GoogleLoginInput;
export interface UserResponse {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: Date;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export type RegisterDto = RegisterInput;
export type LoginDto = LoginInput;
export type RefreshTokenDto = RefreshTokenInput;
//# sourceMappingURL=auth.dto.d.ts.map