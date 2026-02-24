import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { BlockRepository } from "./block.repository.js";
import { BlockService } from "./block.service.js";
import { BlockController } from "./block.controller.js";
import { blockUserRouteSchema, unblockUserRouteSchema, getBlockStatusRouteSchema, getBlockedUsersRouteSchema } from "./block.schema.js";
import { requireAuth } from "../../middleware/auth.js";

export async function blockRoutes(fastify: FastifyInstance) {
    const blockRepository = new BlockRepository();
    const blockService = new BlockService(blockRepository);
    const blockController = new BlockController(blockService);

    fastify.withTypeProvider<ZodTypeProvider>().post("/:id", {
        schema: blockUserRouteSchema,
        preHandler: requireAuth,
        handler: blockController.blockUserHandler
    });

    fastify.withTypeProvider<ZodTypeProvider>().delete("/:id", {
        schema: unblockUserRouteSchema,
        preHandler: requireAuth,
        handler: blockController.unblockUserHandler
    });

    fastify.withTypeProvider<ZodTypeProvider>().get("/", {
        schema: getBlockedUsersRouteSchema,
        preHandler: requireAuth,
        handler: blockController.getBlockedUsersHandler
    });

    fastify.withTypeProvider<ZodTypeProvider>().get("/:id/status", {
        schema: getBlockStatusRouteSchema,
        preHandler: requireAuth,
        handler: blockController.getBlockStatusHandler
    });
}
