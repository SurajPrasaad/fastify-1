/**
 * Call Gateway — WebSocket event handlers for signaling
 * Full architecture integration:
 * - State machine backed by Redis
 * - Distributed presence with multi-device support
 * - Rate limiting & security (IP reputation, payload validation)
 * - Cross-region signaling via Kafka
 * - ICE candidate buffering
 * - Quality telemetry with adaptive bitrate feedback
 * - Video upgrade/downgrade mid-call
 * - Graceful pod shutdown with staggered reconnect
 */

import type { FastifyInstance } from 'fastify';
import type { Socket } from 'socket.io';
import { redis } from '../../config/redis.js';
import { callCoordinator } from './call.coordinator.js';
import { turnService } from './turn.service.js';
import { presenceService } from '../presence/presence.service.js';
import { presenceFederation } from '../presence/presence.federation.js';
import { signalingRateLimiter } from '../security/rate-limiter.js';
import { ipReputation } from '../security/ip-reputation.js';
import { POD_ID } from '../../config/region.js';
import type { CallQualityReport, CallType } from './call.types.js';

// Bounded buffer for backpressure (per-socket)
const MAX_QUEUED_MESSAGES = 1024;

// Track active sockets and calls for graceful shutdown
const activeSockets = new Map<string, Socket>();
let activeCallCount = 0;
let isShuttingDown = false;

export async function callGateway(app: FastifyInstance) {
    app.ready((err) => {
        if (err) throw err;

        const io = (app as any).io;
        if (!io) return;

        // ─────────────── Redis Pub/Sub Subscription Setup ───────────────
        // Each pod subscribes to signals for its connected users
        const subRedis = redis.duplicate();

        io.on('connection', async (socket: Socket) => {
            // Reject new connections during shutdown
            if (isShuttingDown) {
                socket.emit('system:reconnect', {
                    reason: 'MAINTENANCE',
                    retryAfterMs: 1000 + Math.random() * 4000,
                });
                socket.disconnect(true);
                return;
            }

            const session = (socket.request as any).session;
            // Prefer HTTP session userId when present, but fall back to JWT-authenticated userId
            // that was attached by the global Socket.IO auth middleware (chatGateway).
            let userId: string | undefined = session?.userId;
            if (!userId && (socket.data as any)?.userId) {
                userId = (socket.data as any).userId as string;
            }
            const ip = socket.handshake.address;

            // ── Security: IP Reputation Check ──
            if (await ipReputation.isBlocked(ip)) {
                socket.emit('error', { code: 'IP_BLOCKED', message: 'Connection refused' });
                socket.disconnect(true);
                return;
            }

            if (!userId) {
                socket.disconnect(true);
                return;
            }

            // Track active socket
            activeSockets.set(userId, socket);

            // ── Register Presence ──
            const deviceType = (socket.handshake.query['deviceType'] as string) || 'web';
            await presenceService.registerPresence(userId, socket.id, deviceType);
            await presenceFederation.publishPresenceChange(userId, 'ONLINE');

            // ── Subscribe to personal signal channel ──
            const signalChannel = `signal:${userId}`;
            await subRedis.subscribe(signalChannel);

            // Forward Redis signals to the WebSocket
            const messageHandler = (channel: string, message: string) => {
                if (channel === signalChannel) {
                    try {
                        const event = JSON.parse(message);
                        socket.emit(`call:signal`, event);
                    } catch (e) {
                        console.error('[Gateway] Failed to parse signal:', e);
                    }
                }
            };
            subRedis.on('message', messageHandler);

            // ─────────────── Call Initiation ───────────────
            socket.on('call:initiate', async (data: { targetUserId: string; callType: CallType }) => {
                if (!userId) return;

                const result = await callCoordinator.initiate(userId, data, io);

                if (result.success) {
                    activeCallCount++;
                    socket.emit('call:initiated', {
                        callId: result.callId,
                        callType: data.callType,
                    });
                } else {
                    socket.emit('call:rejected', { reason: result.reason });
                }
            });

            // ─────────────── Call Accept ───────────────
            socket.on('call:accept', async (data: { callId: string; callerId: string; callType: CallType }) => {
                if (!userId) return;

                const result = await callCoordinator.accept(data.callId, userId, io);
                if (result.success) {
                    activeCallCount++;
                } else {
                    socket.emit('error', { code: 'ACCEPT_FAILED', message: result.reason });
                }
            });

            // ─────────────── Call Reject ───────────────
            socket.on('call:reject', async (data: { callId: string; callerId: string; reason: string; callType: CallType }) => {
                if (!userId) return;
                await callCoordinator.reject(data.callId, userId, data.reason || 'DECLINED', io);
            });

            // ─────────────── Call End ───────────────
            socket.on('call:end', async (data: { callId: string; targetUserId: string; callType: CallType }) => {
                if (!userId) return;
                const result = await callCoordinator.end(data.callId, userId, io);
                if (result.success) {
                    activeCallCount = Math.max(0, activeCallCount - 1);
                }
            });

            // ─────────────── WebRTC Offer Relay ───────────────
            socket.on('webrtc:offer', async (data: { callId: string; targetUserId: string; sdp: any }) => {
                if (!userId) return;
                await callCoordinator.relayOffer(userId, data);
            });

            // ─────────────── WebRTC Answer Relay ───────────────
            socket.on('webrtc:answer', async (data: { callId: string; targetUserId: string; sdp: any }) => {
                if (!userId) return;
                await callCoordinator.relayAnswer(userId, data);
            });

            // ─────────────── ICE Candidate Relay ───────────────
            socket.on('webrtc:ice-candidate', async (data: { callId: string; targetUserId: string; candidate: any }) => {
                if (!userId) return;
                await callCoordinator.relayIceCandidate(userId, data);
            });

            // ─────────────── Get TURN Credentials ───────────────
            socket.on('call:get-turn-credentials', async (data: { callId?: string }, callback: (creds: any) => void) => {
                if (!userId) return;

                const result = await callCoordinator.getTurnCredentials(userId, data?.callId);
                if (typeof callback === 'function') {
                    callback(result);
                }
            });

            // ─────────────── Call Connected (ICE succeeded) ───────────────
            socket.on('call:connected', async (data: { callId: string }) => {
                if (!userId) return;
                await callCoordinator.onConnected(data.callId);
            });

            // ─────────────── Call Heartbeat ───────────────
            socket.on('call:heartbeat', async (data: { callId: string }) => {
                if (!userId) return;
                if (!await signalingRateLimiter.checkLimit(userId, 'call:heartbeat')) return;
                await callCoordinator.onCallHeartbeat(data.callId);
            });

            // ─────────────── Call Quality Report ───────────────
            socket.on('call:quality', async (report: CallQualityReport) => {
                if (!userId) return;
                if (!await signalingRateLimiter.checkLimit(userId, 'call:quality')) return;
                await callCoordinator.onQualityReport({ ...report, userId });
            });

            // ─────────────── ICE Restart Request ───────────────
            socket.on('call:ice-restart', async (data: { callId: string }) => {
                if (!userId) return;
                await callCoordinator.requestIceRestart(data.callId, userId);
            });

            // ═══════════════════════════════════════════════════
            // VIDEO UPGRADE / DOWNGRADE HANDLERS
            // ═══════════════════════════════════════════════════

            // ─────────────── Request Video Upgrade (Audio → Video) ───────────────
            socket.on('call:upgrade-request', async (data: { callId: string }) => {
                if (!userId) return;

                const result = await callCoordinator.requestUpgrade(data.callId, userId);
                if (!result.success) {
                    socket.emit('call:upgrade-failed', {
                        callId: data.callId,
                        reason: result.reason,
                    });
                }
            });

            // ─────────────── Accept Video Upgrade ───────────────
            socket.on('call:upgrade-accept', async (data: { callId: string }) => {
                if (!userId) return;

                const result = await callCoordinator.acceptUpgrade(data.callId, userId);
                if (!result.success) {
                    socket.emit('error', { code: 'UPGRADE_ACCEPT_FAILED', message: result.reason });
                }
            });

            // ─────────────── Reject Video Upgrade ───────────────
            socket.on('call:upgrade-reject', async (data: { callId: string }) => {
                if (!userId) return;
                await callCoordinator.rejectUpgrade(data.callId, userId);
            });

            // ─────────────── Complete Video Upgrade (after SDP renegotiation) ───────────────
            socket.on('call:upgrade-complete', async (data: { callId: string }) => {
                if (!userId) return;
                await callCoordinator.completeUpgrade(data.callId);
            });

            // ─────────────── Downgrade to Audio (user-initiated) ───────────────
            socket.on('call:downgrade-audio', async (data: { callId: string }) => {
                if (!userId) return;
                await callCoordinator.downgradeToAudio(data.callId, userId);
            });

            // ─────────────── Video Toggle (enable/disable without renegotiation) ───────────────
            socket.on('call:video-toggle', async (data: { callId: string; enabled: boolean }) => {
                if (!userId) return;

                // Video toggle doesn't require SDP renegotiation — just notify peer
                const call = await redis.hgetall(`call:${data.callId}`);
                if (!call?.['callerId']) return;

                const targetUserId = userId === call['callerId'] ? call['receiverId']! : call['callerId']!;

                const event = {
                    type: 'MEDIA_MODE_CHANGED' as const,
                    callId: data.callId,
                    senderId: userId,
                    timestamp: Date.now(),
                    payload: {
                        videoEnabled: data.enabled,
                        action: data.enabled ? 'CAMERA_ON' : 'CAMERA_OFF',
                    },
                };

                await redis.publish(`signal:${targetUserId}`, JSON.stringify(event));
            });

            // ─────────────── Presence Heartbeat ───────────────
            socket.on('presence:heartbeat', async () => {
                if (!userId) return;
                await presenceService.heartbeat(userId);
            });

            // ─────────────── Disconnect ───────────────
            socket.on('disconnect', async () => {
                if (userId) {
                    // Remove from active sockets
                    activeSockets.delete(userId);

                    // Remove presence
                    await presenceService.removePresence(userId);
                    await presenceFederation.publishPresenceChange(userId, 'OFFLINE');

                    // Unsubscribe from signal channel
                    await subRedis.unsubscribe(signalChannel);
                    subRedis.removeListener('message', messageHandler);

                    // Check if user was in an active call and end it
                    const activeCallId = await redis.get(`user:activecall:${userId}`);
                    if (activeCallId) {
                        await callCoordinator.end(activeCallId, userId, io);
                        activeCallCount = Math.max(0, activeCallCount - 1);
                    }

                    console.log(`[Gateway] User ${userId} disconnected`);
                }
            });
        });

        // ═══════════════════════════════════════════════════
        // GRACEFUL SHUTDOWN HANDLER
        // ═══════════════════════════════════════════════════

        setupGracefulShutdown(io);
    });
}

// ─────────────────────────────────────────────────────────────────
// Graceful Shutdown — Staggered drain with connection preservation
// ─────────────────────────────────────────────────────────────────

function setupGracefulShutdown(io: any) {
    const shutdown = async (signal: string) => {
        if (isShuttingDown) return;
        isShuttingDown = true;

        console.log(`[Gateway] ${signal} received — starting graceful shutdown (pod: ${POD_ID})`);

        // 1. Stop accepting new connections (handled by isShuttingDown flag)

        // 2. Notify all connected clients to reconnect with staggered delay
        for (const [userId, socket] of activeSockets.entries()) {
            const retryAfterMs = 1000 + Math.random() * 4000; // 1-5s jitter
            socket.emit('system:reconnect', {
                reason: 'MAINTENANCE',
                retryAfterMs: Math.floor(retryAfterMs),
            });
        }

        // 3. Wait for active calls to drain (max 30s)
        const drainDeadline = Date.now() + 30_000;
        while (activeCallCount > 0 && Date.now() < drainDeadline) {
            console.log(`[Gateway] Draining ${activeCallCount} active calls...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (activeCallCount > 0) {
            console.warn(`[Gateway] Force-closing ${activeCallCount} remaining calls after drain timeout`);
        }

        // 4. Force-close remaining connections
        for (const [userId, socket] of activeSockets.entries()) {
            socket.disconnect(true);
        }
        activeSockets.clear();

        // 5. Cleanup Redis entries for this pod
        await presenceService.cleanupPodPresence(POD_ID);

        console.log(`[Gateway] Graceful shutdown complete (pod: ${POD_ID})`);
        process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}
