import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { AuthRepository } from "./auth.repository.js";
import { registerSchema, loginSchema, verify2FASchema, verify2FALoginSchema, userResponseSchema, verifyEmailSchema, googleLoginSchema, changePasswordSchema } from "./auth.schema.js";
import { requireAuth } from "../../middleware/auth.js";

export async function authRoutes(fastify: FastifyInstance) {
    const authRepository = new AuthRepository();
    const authService = new AuthService(authRepository, fastify);
    const authController = new AuthController(authService);

    fastify.withTypeProvider<ZodTypeProvider>().post(
        "/register",
        {
            schema: {
                body: registerSchema,
                description: "Register a new user",
                tags: ["Auth"],
            },
        },
        authController.registerHandler
    );

    fastify.withTypeProvider<ZodTypeProvider>().get(
        "/verify-email",
        {
            schema: {
                querystring: verifyEmailSchema,
                description: "Verify email address",
                tags: ["Auth"],
            },
        },
        authController.verifyEmailHandler
    );

    fastify.withTypeProvider<ZodTypeProvider>().post(
        "/login",
        {
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
        },
        authController.loginHandler
    );

    fastify.withTypeProvider<ZodTypeProvider>().post(
        "/google",
        {
            schema: {
                body: googleLoginSchema,
                description: "Google Login",
                tags: ["Auth"],
            },
        },
        authController.googleLoginHandler
    );

    fastify.withTypeProvider<ZodTypeProvider>().post(
        "/refresh",
        {
            // No body validation since we read from cookie, but could be body if needed.
            // Typically refresh token is sent in body OR cookie. Controller reads cookie.
            schema: {
                description: "Refresh access token",
                tags: ["Auth"],
            },
        },
        authController.refreshHandler
    );

    fastify.withTypeProvider<ZodTypeProvider>().post(
        "/logout",
        {
            schema: {
                description: "Logout user",
                tags: ["Auth"],
            },
        },
        authController.logoutHandler
    );

    fastify.withTypeProvider<ZodTypeProvider>().get(
        "/me",
        {
            preHandler: requireAuth,
            schema: {
                description: "Get current user",
                tags: ["Auth"],
                response: {
                    200: userResponseSchema
                }
            },
        },
        authController.meHandler
    );
    fastify.withTypeProvider<ZodTypeProvider>().post(
        "/2fa/setup",
        {
            preHandler: requireAuth,
            schema: {
                description: "Setup 2FA",
                tags: ["Auth"],
            }
        },
        authController.setup2FAHandler
    );

    fastify.withTypeProvider<ZodTypeProvider>().post(
        "/2fa/verify",
        {
            preHandler: requireAuth,
            schema: {
                body: verify2FASchema,
                description: "Verify and enable 2FA",
                tags: ["Auth"],
            }
        },
        authController.verify2FAHandler
    );

    fastify.withTypeProvider<ZodTypeProvider>().post(
        "/password/change",
        {
            preHandler: requireAuth,
            schema: {
                body: changePasswordSchema,
                description: "Change user password",
                tags: ["Auth"],
            }
        },
        authController.changePasswordHandler
    );

    fastify.withTypeProvider<ZodTypeProvider>().post(
        "/login/2fa",
        {
            schema: {
                body: verify2FALoginSchema,
                description: "Complete 2FA Login",
                tags: ["Auth"],
            }
        },
        authController.verify2FALoginHandler
    );
}
