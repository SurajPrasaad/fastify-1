import { UserController } from "./user.controller.js";
import { UserService } from "./user.service.js";
import { UserRepository } from "./user.repository.js";
import { createUserRouteSchema, getUserProfileSchema, followUserSchema, unfollowUserSchema, getSuggestionsSchema, getByTechStackSchema, getAllUsersSchema, updateProfileRouteSchema, } from "./user.schema.js";
import { requireAuth } from "../../middleware/auth.js";
import { optionalAuth } from "../../middleware/optional-auth.js";
export async function userRoutes(fastify) {
    const userRepository = new UserRepository();
    const userService = new UserService(userRepository);
    const userController = new UserController(userService);
    fastify.withTypeProvider().get("/", {
        schema: getAllUsersSchema,
    }, userController.getAllUsersHandler);
    // Public Routes
    fastify.withTypeProvider().post("/", {
        schema: createUserRouteSchema,
    }, userController.createUserHandler);
    // Profile Route with optional auth
    fastify.withTypeProvider().get("/:username", {
        schema: getUserProfileSchema,
        preHandler: optionalAuth
    }, userController.getUserProfileHandler);
    // Protected Routes
    fastify.register(async (protectedApp) => {
        protectedApp.addHook("preHandler", requireAuth);
        protectedApp.withTypeProvider().post("/:id/follow", {
            schema: followUserSchema,
        }, userController.followUserHandler);
        protectedApp.withTypeProvider().post("/:id/unfollow", {
            schema: unfollowUserSchema,
        }, userController.unfollowUserHandler);
        protectedApp.withTypeProvider().get("/suggestions", {
            schema: getSuggestionsSchema,
        }, userController.getSuggestionsHandler);
        protectedApp.withTypeProvider().patch("/me", {
            schema: updateProfileRouteSchema,
        }, userController.updateProfileHandler);
        protectedApp.withTypeProvider().get("/search", {
            schema: getByTechStackSchema
        }, userController.getUsersByTechStackHandler);
    });
}
//# sourceMappingURL=user.routes.js.map