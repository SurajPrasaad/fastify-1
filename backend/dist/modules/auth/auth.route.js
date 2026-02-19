import * as controller from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.js";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "./auth.schema.js";
export default async function authRoutes(fastify) {
    fastify.post("/register", { schema: { body: registerSchema } }, controller.registerHandler);
    fastify.post("/login", {
        schema: { body: loginSchema },
        config: {
            rateLimit: {
                max: 5,
                timeWindow: '1 minute'
            }
        }
    }, controller.loginHandler);
    fastify.post("/forgot-password", {
        schema: { body: forgotPasswordSchema },
        config: {
            rateLimit: {
                max: 3,
                timeWindow: '1 hour' // Very strict for forgot password
            }
        }
    }, controller.forgotPasswordHandler);
    fastify.post("/reset-password", { schema: { body: resetPasswordSchema } }, controller.resetPasswordHandler);
    fastify.post("/logout", controller.logoutHandler);
    // ✅ Protected Profile Route
    fastify.get("/profile", { preHandler: requireAuth }, controller.getProfileHandler);
}
//# sourceMappingURL=auth.route.js.map