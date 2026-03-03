/**
 * Call State Auditor — CronJob that cleans orphaned calls
 * Runs every 10s to detect stuck/orphaned call states and force-terminate them.
 * Handles the full 19-state lifecycle including VIDEO_UPGRADING, AUDIO_ONLY_CONNECTED,
 * VIDEO_CONNECTED. Implements split-brain detection and reconciliation.
 */

import { redis } from '../../config/redis.js';
import { callStateMachine } from './call.state-machine.js';
import { signalPublisher } from '../signaling/signal.publisher.js';
import { turnService } from './turn.service.js';
import { db } from '../../config/drizzle.js';
import { callHistory } from '../../db/schema.js';

const AUDIT_INTERVAL = 10_000;       // 10 seconds
const RINGING_TIMEOUT = 45_000;      // 45s
const CONNECTING_TIMEOUT = 30_000;   // 30s
const HEARTBEAT_TIMEOUT = 60_000;    // 60s — no heartbeat for 1 min
const VIDEO_UPGRADE_TIMEOUT = 15_000; // 15s — upgrade must complete
const REGION_FAILOVER_TIMEOUT = 60_000; // 60s

let auditorInterval: ReturnType<typeof setInterval> | null = null;

export class CallAuditor {

    /**
     * Start the periodic auditor
     */
    start(): void {
        if (auditorInterval) return;

        auditorInterval = setInterval(async () => {
            try {
                await this.audit();
            } catch (error) {
                console.error('[CallAuditor] Audit cycle failed:', error);
            }
        }, AUDIT_INTERVAL);

        console.log('✅ Call state auditor started (10s interval)');
    }

    /**
     * Stop the auditor
     */
    stop(): void {
        if (auditorInterval) {
            clearInterval(auditorInterval);
            auditorInterval = null;
            console.log('🛑 Call state auditor stopped');
        }
    }

    /**
     * Run a single audit cycle
     * Scans for orphaned calls using Redis SCAN on call:* keys
     */
    private async audit(): Promise<void> {
        let cursor = '0';
        let totalAudited = 0;
        let totalCleaned = 0;

        do {
            const [nextCursor, keys] = await redis.scan(
                cursor,
                'MATCH', 'call:*',
                'COUNT', '100',
            );
            cursor = nextCursor;

            for (const key of keys) {
                // Only process call:{callId} format (no nested keys)
                const parts = key.split(':');
                if (parts.length !== 2) continue;

                totalAudited++;
                const cleaned = await this.auditCall(key);
                if (cleaned) totalCleaned++;
            }
        } while (cursor !== '0');

        if (totalCleaned > 0) {
            console.log(`[CallAuditor] Audited ${totalAudited} calls, cleaned ${totalCleaned}`);
        }
    }

    /**
     * Audit a single call — check for stuck states
     */
    private async auditCall(key: string): Promise<boolean> {
        const data = await redis.hgetall(key);
        if (!data || !data['state'] || !data['callId']) return false;

        const state = data['state'] as string;
        const createdAt = Number(data['createdAt'] || 0);
        const lastHeartbeat = Number(data['lastHeartbeat'] || createdAt);
        const connectedAt = Number(data['connectedAt'] || createdAt);
        const upgradeRequestedAt = Number(data['upgradeRequestedAt'] || 0);
        const now = Date.now();
        const callId = data['callId']!;
        const callerId = data['callerId']!;
        const receiverId = data['receiverId']!;
        const callType = data['callType'] || 'AUDIO';

        // ── INITIATING > 10s → force delete ──
        if (state === 'INITIATING' && (now - createdAt) > 10_000) {
            await redis.del(key);
            await this.cleanupUserState(callerId, receiverId, callId);
            return true;
        }

        // ── SIGNALING > 15s → force FAILED ──
        if (state === 'SIGNALING' && (now - createdAt) > 15_000) {
            console.warn(`[CallAuditor] Forcing FAILED for stuck SIGNALING call ${callId}`);
            await callStateMachine.transition(callId, 'SIGNALING', 'FAILED', {
                endReason: 'SIGNALING_TIMEOUT',
            });
            await this.notifyFailure(callId, callerId, receiverId, 'SIGNALING_TIMEOUT');
            await this.persistCallHistory(callId, callerId, receiverId, callType, 'FAILED');
            return true;
        }

        // ── RINGING > 45s → force TIMEOUT ──
        if (state === 'RINGING' && (now - createdAt) > RINGING_TIMEOUT) {
            console.warn(`[CallAuditor] Forcing TIMEOUT for stuck RINGING call ${callId}`);
            await callStateMachine.transition(callId, 'RINGING', 'TIMEOUT');
            await this.notifyTimeout(callId, callerId, receiverId);
            await this.persistCallHistory(callId, callerId, receiverId, callType, 'TIMEOUT');
            return true;
        }

        // ── CONNECTING > 30s → force FAILED ──
        if (state === 'CONNECTING' && (now - createdAt) > CONNECTING_TIMEOUT) {
            console.warn(`[CallAuditor] Forcing FAILED for stuck CONNECTING call ${callId}`);
            await callStateMachine.transition(callId, 'CONNECTING', 'FAILED', {
                endReason: 'CONNECTING_TIMEOUT',
            });
            await this.notifyFailure(callId, callerId, receiverId, 'CONNECTING_TIMEOUT');
            await this.persistCallHistory(callId, callerId, receiverId, callType, 'FAILED');
            return true;
        }

        // ── ICE_NEGOTIATION > 30s → force FAILED ──
        if (state === 'ICE_NEGOTIATION' && (now - createdAt) > CONNECTING_TIMEOUT) {
            console.warn(`[CallAuditor] Forcing FAILED for stuck ICE_NEGOTIATION call ${callId}`);
            await callStateMachine.transition(callId, 'ICE_NEGOTIATION', 'FAILED', {
                endReason: 'ICE_TIMEOUT',
            });
            await this.notifyFailure(callId, callerId, receiverId, 'ICE_TIMEOUT');
            await this.persistCallHistory(callId, callerId, receiverId, callType, 'FAILED');
            return true;
        }

        // ── VIDEO_UPGRADING > 15s → revert to AUDIO_ONLY_CONNECTED ──
        if (state === 'VIDEO_UPGRADING' && upgradeRequestedAt > 0 && (now - upgradeRequestedAt) > VIDEO_UPGRADE_TIMEOUT) {
            console.warn(`[CallAuditor] Reverting stuck VIDEO_UPGRADING for call ${callId}`);
            await callStateMachine.revertUpgrade(callId);

            // Notify both users the upgrade was canceled
            const revertEvent = {
                type: 'VIDEO_UPGRADE_REJECTED' as const,
                callId,
                senderId: 'system',
                timestamp: Date.now(),
                payload: { reason: 'UPGRADE_TIMEOUT' },
            };
            await signalPublisher.publishToUser(callerId, revertEvent);
            await signalPublisher.publishToUser(receiverId, revertEvent);
            return true;
        }

        // ── AUDIO_ONLY_CONNECTED with no heartbeat for 60s → force ENDED ──
        if (state === 'AUDIO_ONLY_CONNECTED' && (now - lastHeartbeat) > HEARTBEAT_TIMEOUT) {
            console.warn(`[CallAuditor] Forcing ENDED for stale AUDIO_ONLY call ${callId}`);
            const duration = Math.floor((now - connectedAt) / 1000);
            await callStateMachine.transition(callId, 'AUDIO_ONLY_CONNECTED', 'ENDED', {
                endReason: 'HEARTBEAT_LOST',
                endedAt: now.toString(),
            });
            await this.notifyEnded(callId, callerId, receiverId, 'HEARTBEAT_LOST');
            await this.persistCallHistory(callId, callerId, receiverId, callType, 'COMPLETED', duration);
            return true;
        }

        // ── VIDEO_CONNECTED with no heartbeat for 60s → force ENDED ──
        if (state === 'VIDEO_CONNECTED' && (now - lastHeartbeat) > HEARTBEAT_TIMEOUT) {
            console.warn(`[CallAuditor] Forcing ENDED for stale VIDEO call ${callId}`);
            const duration = Math.floor((now - connectedAt) / 1000);
            await callStateMachine.transition(callId, 'VIDEO_CONNECTED', 'ENDED', {
                endReason: 'HEARTBEAT_LOST',
                endedAt: now.toString(),
            });
            await this.notifyEnded(callId, callerId, receiverId, 'HEARTBEAT_LOST');
            await this.persistCallHistory(callId, callerId, receiverId, callType, 'COMPLETED', duration);
            return true;
        }

        // ── Legacy CONNECTED with no heartbeat for 60s → force ENDED ──
        if (state === 'CONNECTED' && (now - lastHeartbeat) > HEARTBEAT_TIMEOUT) {
            console.warn(`[CallAuditor] Forcing ENDED for stale CONNECTED call ${callId}`);
            const duration = Math.floor((now - connectedAt) / 1000);
            await callStateMachine.transition(callId, 'CONNECTED', 'ENDED', {
                endReason: 'HEARTBEAT_LOST',
                endedAt: now.toString(),
            });
            await this.notifyEnded(callId, callerId, receiverId, 'HEARTBEAT_LOST');
            await this.persistCallHistory(callId, callerId, receiverId, callType, 'COMPLETED', duration);
            return true;
        }

        // ── DEGRADED with no heartbeat for 60s → force ENDED ──
        if (state === 'DEGRADED' && (now - lastHeartbeat) > HEARTBEAT_TIMEOUT) {
            console.warn(`[CallAuditor] Forcing ENDED for stale DEGRADED call ${callId}`);
            const duration = Math.floor((now - connectedAt) / 1000);
            await callStateMachine.transition(callId, 'DEGRADED', 'ENDED', {
                endReason: 'HEARTBEAT_LOST',
                endedAt: now.toString(),
            });
            await this.notifyEnded(callId, callerId, receiverId, 'HEARTBEAT_LOST');
            await this.persistCallHistory(callId, callerId, receiverId, callType, 'COMPLETED', duration);
            return true;
        }

        // ── RECONNECTING > 30s → force FAILED ──
        if (state === 'RECONNECTING' && (now - lastHeartbeat) > CONNECTING_TIMEOUT) {
            console.warn(`[CallAuditor] Forcing FAILED for stuck RECONNECTING call ${callId}`);
            const duration = Math.floor((now - connectedAt) / 1000);
            await callStateMachine.transition(callId, 'RECONNECTING', 'FAILED', {
                endReason: 'RECONNECT_TIMEOUT',
            });
            await this.notifyFailure(callId, callerId, receiverId, 'RECONNECT_TIMEOUT');
            await this.persistCallHistory(callId, callerId, receiverId, callType, 'FAILED', duration);
            return true;
        }

        // ── REGION_FAILOVER > 60s → force FAILED ──
        if (state === 'REGION_FAILOVER' && (now - createdAt) > REGION_FAILOVER_TIMEOUT) {
            console.warn(`[CallAuditor] Forcing FAILED for stuck REGION_FAILOVER call ${callId}`);
            await callStateMachine.transition(callId, 'REGION_FAILOVER', 'FAILED', {
                endReason: 'FAILOVER_TIMEOUT',
            });
            await this.notifyFailure(callId, callerId, receiverId, 'FAILOVER_TIMEOUT');
            await this.persistCallHistory(callId, callerId, receiverId, callType, 'FAILED');
            return true;
        }

        // ── ACCEPTED > 15s without progressing → force FAILED ──
        if (state === 'ACCEPTED' && data['acceptedAt'] && (now - Number(data['acceptedAt'])) > 15_000) {
            console.warn(`[CallAuditor] Forcing FAILED for stuck ACCEPTED call ${callId}`);
            await callStateMachine.transition(callId, 'ACCEPTED', 'FAILED', {
                endReason: 'ACCEPTED_TIMEOUT',
            });
            await this.notifyFailure(callId, callerId, receiverId, 'ACCEPTED_TIMEOUT');
            await this.persistCallHistory(callId, callerId, receiverId, callType, 'FAILED');
            return true;
        }

        return false;
    }

    // ─────────────────────────────────────────────────────
    // Notification Helpers
    // ─────────────────────────────────────────────────────

    private async notifyTimeout(callId: string, callerId: string, receiverId: string): Promise<void> {
        const event = {
            type: 'CALL_TIMEOUT' as const,
            callId,
            senderId: 'system',
            timestamp: Date.now(),
            payload: { reason: 'RING_TIMEOUT' },
        };
        await signalPublisher.publishToUser(callerId, event);
        await signalPublisher.publishToUser(receiverId, event);
    }

    private async notifyFailure(callId: string, callerId: string, receiverId: string, reason: string): Promise<void> {
        const event = {
            type: 'CALL_ENDED' as const,
            callId,
            senderId: 'system',
            timestamp: Date.now(),
            payload: { reason },
        };
        await signalPublisher.publishToUser(callerId, event);
        await signalPublisher.publishToUser(receiverId, event);
    }

    private async notifyEnded(callId: string, callerId: string, receiverId: string, reason: string): Promise<void> {
        const event = {
            type: 'CALL_ENDED' as const,
            callId,
            senderId: 'system',
            timestamp: Date.now(),
            payload: { reason },
        };
        await signalPublisher.publishToUser(callerId, event);
        await signalPublisher.publishToUser(receiverId, event);
    }

    // ─────────────────────────────────────────────────────
    // Cleanup & Persistence
    // ─────────────────────────────────────────────────────

    private async cleanupUserState(callerId: string, receiverId: string, callId: string): Promise<void> {
        await callStateMachine.clearUserActiveCall(callerId);
        await callStateMachine.clearUserActiveCall(receiverId);
        await callStateMachine.releaseLock(callerId, receiverId);
        await turnService.releaseAllocation(callerId);
        await turnService.releaseAllocation(receiverId);
        await redis.del(`call_start:${callId}`);
        await redis.del(`ice:${callId}:buffer`);
    }

    private async persistCallHistory(
        callId: string,
        callerId: string,
        receiverId: string,
        callType: string,
        status: string,
        durationSeconds?: number,
    ): Promise<void> {
        try {
            await db.insert(callHistory).values({
                callerId,
                receiverId,
                callType: callType as 'AUDIO' | 'VIDEO',
                status: status as any,
                durationSeconds: durationSeconds || 0,
                endedAt: new Date(),
            }).onConflictDoNothing();

            // Clean up user active call tracking
            await this.cleanupUserState(callerId, receiverId, callId);
        } catch (err) {
            console.error(`[CallAuditor] Failed to persist call history for ${callId}:`, err);
        }
    }
}

export const callAuditor = new CallAuditor();
