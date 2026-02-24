import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { UserController } from "./user.controller.js";
import { UserService } from "./user.service.js";
import { UserRepository } from "./user.repository.js";
import {
    createUserRouteSchema,
    getUserProfileSchema,
    followUserSchema,
    unfollowUserSchema,
    getSuggestionsSchema,
    getByTechStackSchema,
    getAllUsersSchema,
    updateProfileRouteSchema,
    getFollowsSchema,
    getUserPrivacySchema,
    updatePrivacyRouteSchema,
    getSecuritySchema,
    revokeSessionRouteSchema,
    revokeAppRouteSchema,
    getNotificationSettingsRouteSchema,
    updateNotificationSettingsRouteSchema,
} from "./user.schema.js";

import { requireAuth } from "../../middleware/auth.js";
import { optionalAuth } from "../../middleware/optional-auth.js";
import { getUserRepliesHandler, getUserLikedPostsHandler } from "../interaction/interaction.controller.js";
import { getUserRepliesSchema } from "../interaction/interaction.schema.js";
import { getUserPostsHandler } from "../post/post.controller.js";
import { getPostsQuerySchema } from "../post/post.schema.js";

export async function userRoutes(fastify: FastifyInstance) {
    const userRepository = new UserRepository();
    const userService = new UserService(userRepository);
    const userController = new UserController(userService);

    fastify.withTypeProvider<ZodTypeProvider>().get(
        "/",
        {
            schema: getAllUsersSchema,
        },
        userController.getAllUsersHandler
    );

    // Public Routes
    fastify.withTypeProvider<ZodTypeProvider>().post(
        "/",
        {
            schema: createUserRouteSchema,
        },
        userController.createUserHandler
    );

    // Profile Route with optional auth
    fastify.withTypeProvider<ZodTypeProvider>().get(
        "/:username",
        {
            schema: getUserProfileSchema,
            preHandler: optionalAuth as any
        },
        userController.getUserProfileHandler
    );

    // Followers List
    fastify.withTypeProvider<ZodTypeProvider>().get(
        "/:username/followers",
        {
            schema: getFollowsSchema,
            preHandler: optionalAuth as any
        },
        userController.getFollowersHandler
    );

    // Following List
    fastify.withTypeProvider<ZodTypeProvider>().get(
        "/:username/following",
        {
            schema: getFollowsSchema,
            preHandler: optionalAuth as any
        },
        userController.getFollowingHandler
    );

    // Protected Routes
    fastify.register(async (protectedApp) => {
        protectedApp.addHook("preHandler", requireAuth);

        protectedApp.withTypeProvider<ZodTypeProvider>().post(
            "/:id/follow",
            {
                schema: followUserSchema,
            },
            userController.followUserHandler
        );

        protectedApp.withTypeProvider<ZodTypeProvider>().post(
            "/:id/unfollow",
            {
                schema: unfollowUserSchema,
            },
            userController.unfollowUserHandler
        );

        protectedApp.withTypeProvider<ZodTypeProvider>().get(
            "/suggestions",
            {
                schema: getSuggestionsSchema,
            },
            userController.getSuggestionsHandler
        );

        protectedApp.withTypeProvider<ZodTypeProvider>().get(
            "/me/active-friends",
            {},
            userController.getActiveFriendsHandler
        );

        protectedApp.withTypeProvider<ZodTypeProvider>().patch(
            "/me",
            {
                schema: updateProfileRouteSchema,
            },
            userController.updateProfileHandler
        );

        protectedApp.withTypeProvider<ZodTypeProvider>().get(
            "/search",
            {
                schema: getByTechStackSchema
            },
            userController.getUsersByTechStackHandler
        );

        protectedApp.withTypeProvider<ZodTypeProvider>().get(
            "/me/replies",
            {
                schema: {
                    querystring: getUserRepliesSchema,
                    tags: ["Profile"],
                    description: "Get current user's replies",
                }
            },
            getUserRepliesHandler
        );

        protectedApp.withTypeProvider<ZodTypeProvider>().get(
            "/me/posts",
            {
                schema: {
                    querystring: getPostsQuerySchema,
                    tags: ["Profile"],
                    description: "Get current user's posts",
                }
            },
            getUserPostsHandler
        );

        protectedApp.withTypeProvider<ZodTypeProvider>().get(
            "/me/likes",
            {
                schema: {
                    querystring: getUserRepliesSchema,
                    tags: ["Profile"],
                    description: "Get current user's liked posts",
                }
            },
            getUserLikedPostsHandler
        );

        protectedApp.withTypeProvider<ZodTypeProvider>().post(
            "/me/deactivate",
            {
                schema: {
                    tags: ["Account"],
                    description: "Deactivate account",
                }
            },
            userController.deactivateAccountHandler
        );

        protectedApp.withTypeProvider<ZodTypeProvider>().delete(
            "/me",
            {
                schema: {
                    tags: ["Account"],
                    description: "Delete account",
                }
            },
            userController.deleteAccountHandler
        );

        protectedApp.withTypeProvider<ZodTypeProvider>().get(
            "/me/privacy",
            {
                schema: getUserPrivacySchema,
            },
            userController.getPrivacyHandler
        );

        protectedApp.withTypeProvider<ZodTypeProvider>().patch(
            "/me/privacy",
            {
                schema: updatePrivacyRouteSchema,
            },
            userController.updatePrivacyHandler
        );

        protectedApp.withTypeProvider<ZodTypeProvider>().get(
            "/me/security",
            {
                schema: getSecuritySchema,
            },
            userController.getSecurityHandler
        );

        protectedApp.withTypeProvider<ZodTypeProvider>().delete(
            "/me/security/sessions/:sessionId",
            {
                schema: revokeSessionRouteSchema,
            },
            userController.revokeSessionHandler
        );

        protectedApp.withTypeProvider<ZodTypeProvider>().delete(
            "/me/security/apps/:appId",
            {
                schema: revokeAppRouteSchema,
            },
            userController.revokeAppHandler
        );

        protectedApp.withTypeProvider<ZodTypeProvider>().get(
            "/me/notifications/settings",
            {
                schema: getNotificationSettingsRouteSchema,
            },
            userController.getNotificationSettingsHandler
        );

        protectedApp.withTypeProvider<ZodTypeProvider>().patch(
            "/me/notifications/settings",
            {
                schema: updateNotificationSettingsRouteSchema,
            },
            userController.updateNotificationSettingsHandler
        );
    });
}
