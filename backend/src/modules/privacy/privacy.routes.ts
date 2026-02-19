import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { PrivacyRepository } from "./privacy.repository.js";
import { PrivacyService } from "./privacy.service.js";
import { PrivacyController } from "./privacy.controller.js";
import { getPrivacyRouteSchema, updatePrivacyRouteSchema } from "./privacy.schema.js";

import { requireAuth } from "../../middleware/auth.js";

export async function privacyRoutes(fastify: FastifyInstance) {
    const privacyRepository = new PrivacyRepository();
    const privacyService = new PrivacyService(privacyRepository);
    const privacyController = new PrivacyController(privacyService);

    fastify.withTypeProvider<ZodTypeProvider>().get("/", {
        schema: getPrivacyRouteSchema,
        preHandler: requireAuth,
        handler: privacyController.getSettingsHandler
    });

    fastify.withTypeProvider<ZodTypeProvider>().patch("/", {
        schema: updatePrivacyRouteSchema,
        preHandler: requireAuth,
        handler: privacyController.updateSettingsHandler
    });
}
