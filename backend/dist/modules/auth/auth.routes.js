import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { AuthRepository } from "./auth.repository.js";
import { registerSchema, loginSchema, verify2FASchema, verify2FALoginSchema, userResponseSchema, verifyEmailSchema, googleLoginSchema } from "./auth.schema.js";
import { requireAuth } from "../../middleware/auth.js";
export async function authRoutes(fastify) {
    const authRepository = new AuthRepository();
    const authService = new AuthService(authRepository, fastify);
    const authController = new AuthController(authService);
    fastify.withTypeProvider().post("/register", {
        schema: {
            body: registerSchema,
            description: "Register a new user",
            tags: ["Auth"],
        },
    }, authController.registerHandler);
    fastify.withTypeProvider().get("/verify-email", {
        schema: {
            querystring: verifyEmailSchema,
            description: "Verify email address",
            tags: ["Auth"],
        },
    }, authController.verifyEmailHandler);
    fastify.withTypeProvider().post("/login", {
        schema: {
            body: loginSchema,
            description: "Login user",
            tags: ["Auth"],
        },
        config: {
            rateLimit: {
                max: 5,
                timeWindow: "1 minute",
            },
        },
    }, authController.loginHandler);
    fastify.withTypeProvider().post("/google", {
        schema: {
            body: googleLoginSchema,
            description: "Google Login",
            tags: ["Auth"],
        },
    }, authController.googleLoginHandler);
    fastify.withTypeProvider().post("/refresh", {
        // No body validation since we read from cookie, but could be body if needed.
        // Typically refresh token is sent in body OR cookie. Controller reads cookie.
        schema: {
            description: "Refresh access token",
            tags: ["Auth"],
        },
    }, authController.refreshHandler);
    fastify.withTypeProvider().post("/logout", {
        schema: {
            description: "Logout user",
            tags: ["Auth"],
        },
    }, authController.logoutHandler);
    fastify.withTypeProvider().get("/me", {
        preHandler: requireAuth,
        schema: {
            description: "Get current user",
            tags: ["Auth"],
            response: {
                200: userResponseSchema
            }
        },
    }, authController.meHandler);
    fastify.withTypeProvider().post("/2fa/setup", {
        preHandler: requireAuth,
        schema: {
            description: "Setup 2FA",
            tags: ["Auth"],
        }
    }, authController.setup2FAHandler);
    fastify.withTypeProvider().post("/2fa/verify", {
        preHandler: requireAuth,
        schema: {
            body: verify2FASchema,
            description: "Verify and enable 2FA",
            tags: ["Auth"],
        }
    }, authController.verify2FAHandler);
    fastify.withTypeProvider().post("/login/2fa", {
        schema: {
            body: verify2FALoginSchema,
            description: "Complete 2FA Login",
            tags: ["Auth"],
        }
    }, authController.verify2FALoginHandler);
}
//# sourceMappingURL=auth.routes.js.map