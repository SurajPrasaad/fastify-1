
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { CommentController } from "./comment.controller.js";
import { CommentService } from "./comment.service.js";
import { CommentRepository } from "./comment.repository.js";
import { requireAuth } from "../../middleware/auth.js";
import { createCommentRouteSchema, getCommentsRouteSchema } from "./comment.schema.js";

export async function commentRoutes(fastify: FastifyInstance) {
    const repository = new CommentRepository();
    const service = new CommentService(repository);
    const controller = new CommentController(service);

    fastify.get("/", async () => {
        return { message: "Comment API is running" };
    });

    // Public Routes
    fastify.withTypeProvider<ZodTypeProvider>().get(
        "/:postId",
        {
            schema: getCommentsRouteSchema,
        },
        controller.getCommentsHandler
    );

    // Protected Routes
    fastify.register(async (protectedApp) => {
        protectedApp.addHook("preHandler", requireAuth);

        protectedApp.withTypeProvider<ZodTypeProvider>().post(
            "/:postId",
            {
                schema: createCommentRouteSchema,
                config: {
                    rateLimit: {
                        max: 10,
                        timeWindow: "1 minute",
                    },
                },
            },
            controller.createCommentHandler
        );
    });
}
