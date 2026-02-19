import { BlockRepository } from "./block.repository.js";
import { BlockService } from "./block.service.js";
import { BlockController } from "./block.controller.js";
import { blockUserRouteSchema, unblockUserRouteSchema } from "./block.schema.js";
import { requireAuth } from "../../middleware/auth.js";
export async function blockRoutes(fastify) {
    const blockRepository = new BlockRepository();
    const blockService = new BlockService(blockRepository);
    const blockController = new BlockController(blockService);
    fastify.withTypeProvider().post("/:id", {
        schema: blockUserRouteSchema,
        preHandler: requireAuth,
        handler: blockController.blockUserHandler
    });
    fastify.withTypeProvider().delete("/:id", {
        schema: unblockUserRouteSchema,
        preHandler: requireAuth,
        handler: blockController.unblockUserHandler
    });
}
//# sourceMappingURL=block.routes.js.map