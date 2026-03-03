/**
 * Appeals Routes — REST API
 *
 * - POST /appeals — create appeal (authenticated user)
 * - GET /appeals — list appeals (moderator+: filter by status, user, etc.)
 * - GET /appeals/pending-count — pending count (moderator+)
 * - GET /appeals/:id — get one (user own or moderator+)
 * - POST /appeals/review — review appeal (moderator+)
 */

import type { FastifyInstance } from "fastify";
import * as controller from "./appeals.controller.js";
import { createAppealSchema, reviewAppealSchema } from "./appeals.schema.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";

export async function appealsRoutes(app: FastifyInstance) {
    // User: submit appeal
    app.post("/", {
        preHandler: [requireAuth],
        schema: { body: createAppealSchema },
    }, controller.createAppeal as any);

    // Moderator+: list, pending count, get by id, review
    app.register(async (modRoutes) => {
        modRoutes.addHook("preHandler", requireAuth);
        modRoutes.addHook("preHandler", requireRole("MODERATOR"));

        modRoutes.get("/", controller.listAppeals as any);
        modRoutes.get("/pending-count", controller.getPendingCount as any);
        modRoutes.get("/:id", controller.getAppealById as any);
        modRoutes.post("/review", {
            schema: { body: reviewAppealSchema },
        }, controller.reviewAppeal as any);
    });
}
