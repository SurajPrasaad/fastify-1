/**
 * Moderation Routes — REST API Endpoints
 * 
 * Route-level protection using RBAC middleware:
 * - /report: USER (anyone authenticated)
 * - /queue, /moderate, /lock: MODERATOR+
 * - /admin/*: ADMIN only
 */

import type { FastifyInstance } from "fastify";
import { ModerationController } from "./moderation.controller.js";
import { createReportSchema, moderatePostSchema, resolveReportSchema } from "./moderation.schema.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole, requirePermission, PERMISSIONS } from "../../middleware/rbac.js";

export async function moderationRoutes(app: FastifyInstance) {
    const controller = new ModerationController();

    // ─── User Routes (any authenticated user can report) ─

    app.post('/report', {
        preHandler: [requireAuth],
        schema: {
            body: createReportSchema,
        }
    }, (req, res) => controller.createReport(req as any, res));

    // ─── Moderator Routes ────────────────────────────────

    app.register(async (modRoutes) => {
        modRoutes.addHook('preHandler', requireAuth);
        modRoutes.addHook('preHandler', requireRole("MODERATOR"));

        // Pre-moderation queue (posts pending review)
        modRoutes.get('/queue', (req, res) => controller.getModerationQueue(req as any, res));

        // Moderate a post (approve/reject/request revision)
        modRoutes.post('/moderate', {
            schema: { body: moderatePostSchema },
        }, (req, res) => controller.moderatePost(req as any, res));

        // Lock a post for exclusive review
        modRoutes.post('/lock/:postId', (req, res) => controller.lockPost(req as any, res));

        // Unlock a post
        modRoutes.delete('/lock/:postId', (req, res) => controller.unlockPost(req as any, res));

        // Get moderation history for a post
        modRoutes.get('/history/:postId', (req, res) => controller.getPostHistory(req as any, res));

        // Queue statistics
        modRoutes.get('/stats', (req, res) => controller.getQueueStats(req as any, res));

        // Legacy report queue
        modRoutes.get('/reports/queue', (req, res) => controller.getQueue(req as any, res));

        // Assign queue task to self
        modRoutes.post('/reports/queue/:queueId/assign', (req, res) => controller.assignTask(req as any, res));

        // Resolve a report
        modRoutes.post('/reports/resolve', {
            schema: { body: resolveReportSchema },
        }, (req, res) => controller.resolveReport(req as any, res));
    });
}
