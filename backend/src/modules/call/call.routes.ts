/**
 * Call Routes — REST endpoints for call-related operations
 * Includes: call history, TURN credential issuance, call state query,
 * IP reputation, video upgrade control, TURN load monitoring
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../../config/drizzle.js';
import { callHistory, users } from '../../db/schema.js';
import { eq, or, desc, aliasedTable } from 'drizzle-orm';
import { AppError } from '../../utils/AppError.js';
import { turnService } from './turn.service.js';
import { callStateMachine } from './call.state-machine.js';
import { callQualityService } from './call.quality.js';
import { presenceService } from '../presence/presence.service.js';
import { ipReputation } from '../security/ip-reputation.js';
import { requireAuth } from '../../middleware/auth.js';

export async function callRoutes(app: FastifyInstance) {

    // ─────────────────────────────────────────────────────
    // GET /call/history — Call history for authenticated user
    // ─────────────────────────────────────────────────────
    app.get('/history', { preHandler: [requireAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).session?.userId;
        if (!userId) throw new AppError('Unauthorized', 401);

        const callerAlias = aliasedTable(users, 'caller');
        const receiverAlias = aliasedTable(users, 'receiver');

        const history = await db
            .select({
                id: callHistory.id,
                callerId: callHistory.callerId,
                receiverId: callHistory.receiverId,
                callType: callHistory.callType,
                status: callHistory.status,
                durationSeconds: callHistory.durationSeconds,
                startedAt: callHistory.startedAt,
                endedAt: callHistory.endedAt,
                caller: {
                    id: callerAlias.id,
                    name: callerAlias.name,
                    username: callerAlias.username,
                    avatarUrl: callerAlias.avatarUrl,
                },
                receiver: {
                    id: receiverAlias.id,
                    name: receiverAlias.name,
                    username: receiverAlias.username,
                    avatarUrl: receiverAlias.avatarUrl,
                },
            })
            .from(callHistory)
            .leftJoin(callerAlias, eq(callHistory.callerId, callerAlias.id))
            .leftJoin(receiverAlias, eq(callHistory.receiverId, receiverAlias.id))
            .where(
                or(
                    eq(callHistory.callerId, userId),
                    eq(callHistory.receiverId, userId),
                ),
            )
            .orderBy(desc(callHistory.startedAt))
            .limit(50);

        return history;
    });

    // ─────────────────────────────────────────────────────
    // DELETE /call/history/:id — Delete a call log entry
    // ─────────────────────────────────────────────────────
    app.delete<{ Params: { id: string } }>('/history/:id', { preHandler: [requireAuth] }, async (request, reply) => {
        const userId = (request as any).session?.userId;
        const { id } = request.params;

        if (!userId) throw new AppError('Unauthorized', 401);

        const log = await db.select().from(callHistory).where(eq(callHistory.id, id)).limit(1);
        if (!log[0]) throw new AppError('Call log not found', 404);

        if (log[0].callerId !== userId && log[0].receiverId !== userId) {
            throw new AppError('Forbidden', 403);
        }

        await db.delete(callHistory).where(eq(callHistory.id, id));
        return { success: true };
    });

    // ─────────────────────────────────────────────────────
    // POST /call/turn-credentials — Issue ephemeral TURN credentials
    // Supports optional callId for cross-region optimization
    // ─────────────────────────────────────────────────────
    app.post<{ Body: { callId?: string } }>('/turn-credentials', { preHandler: [requireAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).session?.userId;
        if (!userId) throw new AppError('Unauthorized', 401);

        try {
            const body = request.body as { callId?: string } || {};
            let credentials;

            if (body.callId) {
                // Cross-region aware TURN selection when we know the call
                const call = await callStateMachine.getCall(body.callId);
                if (call) {
                    const callerLoc = await presenceService.resolveUserLocation(call.callerId);
                    const calleeLoc = await presenceService.resolveUserLocation(call.receiverId);
                    credentials = await turnService.issueForCall(
                        userId,
                        callerLoc?.region || 'us-east',
                        calleeLoc?.region || 'us-east',
                    );
                } else {
                    credentials = await turnService.issue(userId);
                }
            } else {
                credentials = await turnService.issue(userId);
            }

            return { success: true, credentials };
        } catch (err: any) {
            throw new AppError(err.message || 'Failed to issue TURN credentials', 503);
        }
    });

    // ─────────────────────────────────────────────────────
    // GET /call/state/:callId — Get current call state
    // ─────────────────────────────────────────────────────
    app.get<{ Params: { callId: string } }>('/state/:callId', { preHandler: [requireAuth] }, async (request, reply) => {
        const userId = (request as any).session?.userId;
        const { callId } = request.params;
        if (!userId) throw new AppError('Unauthorized', 401);

        const call = await callStateMachine.getCall(callId);
        if (!call) throw new AppError('Call not found', 404);

        // Only participants can view call state
        if (call.callerId !== userId && call.receiverId !== userId) {
            throw new AppError('Forbidden', 403);
        }

        return {
            callId: call.callId,
            state: call.state,
            callType: call.callType,
            mediaMode: call.mediaMode,
            callerId: call.callerId,
            receiverId: call.receiverId,
            createdAt: call.createdAt,
            connectedAt: call.connectedAt,
            upgradeRequestedBy: call.upgradeRequestedBy,
        };
    });

    // ─────────────────────────────────────────────────────
    // GET /call/presence/:userId — Check if a user is online
    // ─────────────────────────────────────────────────────
    app.get<{ Params: { userId: string } }>('/presence/:userId', { preHandler: [requireAuth] }, async (request, reply) => {
        const requesterId = (request as any).session?.userId;
        if (!requesterId) throw new AppError('Unauthorized', 401);

        const { userId } = request.params;
        const online = await presenceService.isOnline(userId);

        return { userId, online };
    });

    // ─────────────────────────────────────────────────────
    // GET /call/active — Get current user's active call
    // ─────────────────────────────────────────────────────
    app.get('/active', { preHandler: [requireAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).session?.userId;
        if (!userId) throw new AppError('Unauthorized', 401);

        const callId = await callStateMachine.isUserInCall(userId);
        if (!callId) {
            return { activeCall: null };
        }

        const call = await callStateMachine.getCall(callId);
        return { activeCall: call };
    });

    // ─────────────────────────────────────────────────────
    // GET /call/turn-load — Get TURN load across all regions
    // (For observability dashboards)
    // ─────────────────────────────────────────────────────
    app.get('/turn-load', { preHandler: [requireAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).session?.userId;
        if (!userId) throw new AppError('Unauthorized', 401);

        const loadReport = await turnService.getGlobalLoadReport();
        return { regions: loadReport };
    });

    // ─────────────────────────────────────────────────────
    // POST /call/turn-load/report — Report TURN load (from coturn health monitor)
    // ─────────────────────────────────────────────────────
    app.post<{ Body: { region: string; loadPercent: number } }>('/turn-load/report', async (request, reply) => {
        const body = request.body as { region: string; loadPercent: number };
        if (!body.region || body.loadPercent === undefined) {
            throw new AppError('Missing region or loadPercent', 400);
        }

        await turnService.reportLoad(body.region, body.loadPercent);
        return { success: true };
    });

    // ─────────────────────────────────────────────────────
    // POST /call/quality/analyze — Analyze a quality report
    // Returns bandwidth tier and codec recommendations
    // ─────────────────────────────────────────────────────
    app.post('/quality/analyze', { preHandler: [requireAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).session?.userId;
        if (!userId) throw new AppError('Unauthorized', 401);

        const report = request.body as any;
        if (!report.callId) throw new AppError('Missing callId', 400);

        const analysis = callQualityService.analyzeBandwidth({ ...report, userId });

        return {
            bandwidthTier: analysis.tier,
            estimatedBandwidth: analysis.estimatedBandwidth,
            opus: analysis.recommendedOpusMode,
            video: analysis.recommendedVideoResolution
                ? callQualityService.getVideoRecommendation({ ...report, userId })
                : null,
            shouldFallbackToAudio: analysis.shouldFallbackToAudio,
            packetLossStrategy: callQualityService.getPacketLossStrategy({ ...report, userId }),
        };
    });

    // ─────────────────────────────────────────────────────
    // GET /call/ip-reputation/:ip — IP reputation score lookup
    // ─────────────────────────────────────────────────────
    app.get<{ Params: { ip: string } }>('/ip-reputation/:ip', { preHandler: [requireAuth] }, async (request, reply) => {
        const { ip } = request.params;
        const score = await ipReputation.getScore(ip);
        const blocked = await ipReputation.isBlocked(ip);
        return { ip, score, blocked };
    });
}
