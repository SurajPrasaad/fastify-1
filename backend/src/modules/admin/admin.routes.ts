/**
 * Admin Routes — REST API Endpoints (ADMIN only)
 * 
 * All routes protected by requireAuth + requireRole("ADMIN").
 * Uses the new RBAC middleware for proper role enforcement.
 */

import type { FastifyInstance } from "fastify";
import { AdminController } from "./admin.controller.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";

export async function adminRoutes(app: FastifyInstance) {
    const controller = new AdminController();

    app.register(async (protectedRoutes) => {
        protectedRoutes.addHook('preHandler', requireAuth);
        protectedRoutes.addHook('preHandler', requireRole("ADMIN"));

        protectedRoutes.get('/audit-logs', (req, res) => controller.getAuditLogs(req as any, res));
        protectedRoutes.post('/bulk-action', (req, res) => controller.bulkAction(req as any, res));
        protectedRoutes.get('/stats', (req, res) => controller.getStats(req as any, res));
    });
}
