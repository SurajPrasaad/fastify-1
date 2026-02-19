import type { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "./auth.service.js";
import type { RegisterInput, LoginInput } from "./auth.schema.js";
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    registerHandler: (request: FastifyRequest<{
        Body: RegisterInput;
    }>, reply: FastifyReply) => Promise<never>;
    verifyEmailHandler: (request: FastifyRequest<{
        Querystring: {
            token: string;
        };
    }>, reply: FastifyReply) => Promise<never>;
    loginHandler: (request: FastifyRequest<{
        Body: LoginInput;
    }>, reply: FastifyReply) => Promise<never>;
    googleLoginHandler: (request: FastifyRequest<{
        Body: {
            idToken: string;
            deviceId: string;
        };
    }>, reply: FastifyReply) => Promise<never>;
    setup2FAHandler: (request: FastifyRequest, reply: FastifyReply) => Promise<never>;
    verify2FAHandler: (request: FastifyRequest, reply: FastifyReply) => Promise<never>;
    verify2FALoginHandler: (request: FastifyRequest, reply: FastifyReply) => Promise<never>;
    refreshHandler: (request: FastifyRequest, reply: FastifyReply) => Promise<never>;
    logoutHandler: (request: FastifyRequest, reply: FastifyReply) => Promise<never>;
    meHandler: (request: FastifyRequest, reply: FastifyReply) => Promise<never>;
    private setRefreshTokenCookie;
}
//# sourceMappingURL=auth.controller.d.ts.map