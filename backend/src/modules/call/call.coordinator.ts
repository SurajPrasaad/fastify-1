/**
 * Call Coordinator — Orchestrates the full call lifecycle
 * Integrates: state machine, authorization, presence, signaling, TURN, quality
 * Supports: audio-only optimized path, video calls, mid-call voice↔video upgrade,
 * graceful degradation, and bandwidth-adaptive decisions.
 */

import { db } from '../../config/drizzle.js';
import { redis } from '../../config/redis.js';
import { callHistory, users } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { callStateMachine } from './call.state-machine.js';
import { callAuthorization } from './call.authorization.js';
import { turnService } from './turn.service.js';
import { callQualityService } from './call.quality.js';
import { presenceService } from '../presence/presence.service.js';
import { signalPublisher } from '../signaling/signal.publisher.js';
import { signalingRateLimiter } from '../security/rate-limiter.js';
import { LOCAL_REGION } from '../../config/region.js';
import type { CallType, CallState, CallQualityReport, SignalEvent } from './call.types.js';
import { ChatRepository } from '../chat/chat.repository.js';
import { MessageType } from '../chat/chat.model.js';

const chatRepository = new ChatRepository();

function generateCallId(): string {
    return `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export class CallCoordinator {

    // ─────────────────────────────────────────────────────
    // INITIATE CALL (Audio-Only Optimized + Video)
    // ─────────────────────────────────────────────────────

    async initiate(
        callerId: string,
        input: { targetUserId: string; callType: CallType },
        io: any,
    ): Promise<{ success: boolean; callId?: string; reason?: string }> {

        // 1. Rate limit check
        const allowed = await signalingRateLimiter.checkLimit(callerId, 'call:initiate');
        if (!allowed) {
            return { success: false, reason: 'RATE_LIMIT_EXCEEDED' };
        }

        // 2. Check if caller is already in a call
        const existingCall = await callStateMachine.isUserInCall(callerId);
        if (existingCall) {
            return { success: false, reason: 'ALREADY_IN_CALL' };
        }

        // 3. Check if target is already in a call
        const targetInCall = await callStateMachine.isUserInCall(input.targetUserId);
        if (targetInCall) {
            return { success: false, reason: 'TARGET_BUSY' };
        }

        // 4. Authorization check (block, privacy, follow, spam)
        const authResult = await callAuthorization.authorizeCall(callerId, input.targetUserId);
        if (!authResult.allowed) {
            return { success: false, reason: authResult.reason || 'PERMISSION_DENIED' };
        }

        // 5. Check target presence
        const targetLocation = await presenceService.resolveUserLocation(input.targetUserId);
        if (!targetLocation) {
            // Target is offline — log missed call
            await this.logMissedCall(callerId, input.targetUserId, input.callType, io);
            return { success: false, reason: 'USER_OFFLINE' };
        }

        // 6. Create call in state machine (mediaMode set based on callType)
        const callId = generateCallId();
        const created = await callStateMachine.createCall(
            callId,
            callerId,
            input.targetUserId,
            input.callType,
        );

        if (!created) {
            return { success: false, reason: 'SIMULTANEOUS_CALL_CONFLICT' };
        }

        // 7. Track active call for both users
        await callStateMachine.setUserActiveCall(callerId, callId);
        await callStateMachine.setUserActiveCall(input.targetUserId, callId);

        // 8. Transition to SIGNALING
        await callStateMachine.transition(callId, 'INITIATING', 'SIGNALING');

        // 9. Get caller profile for the incoming call notification
        const callerProfile = await db
            .select({ id: users.id, name: users.name, username: users.username, avatarUrl: users.avatarUrl })
            .from(users)
            .where(eq(users.id, callerId))
            .limit(1);

        const caller = callerProfile[0];
        if (!caller) {
            return { success: false, reason: 'CALLER_NOT_FOUND' };
        }

        // 10. Send call:incoming signal to target
        const incomingEvent: SignalEvent = {
            type: 'CALL_INCOMING',
            callId,
            senderId: callerId,
            timestamp: Date.now(),
            payload: {
                callerId: caller.id,
                callerName: caller.name,
                callerAvatar: caller.avatarUrl,
                callerUsername: caller.username,
                callType: input.callType,
            },
        };

        const delivered = await signalPublisher.publishToUser(input.targetUserId, incomingEvent);

        if (delivered) {
            // 11. Transition to RINGING
            await callStateMachine.transition(callId, 'SIGNALING', 'RINGING');
        } else {
            // Delivery failed (user went offline between check and send)
            await callStateMachine.transition(callId, 'SIGNALING', 'FAILED', {
                endReason: 'DELIVERY_FAILED',
            });
            await this.cleanup(callId, callerId, input.targetUserId);
            return { success: false, reason: 'DELIVERY_FAILED' };
        }

        // 12. Publish call event to Kafka for analytics
        await signalPublisher.publishCallEvent({
            type: 'CALL_INITIATED',
            callId,
            callerId,
            receiverId: input.targetUserId,
            callType: input.callType,
            region: LOCAL_REGION,
        });

        return { success: true, callId };
    }

    // ─────────────────────────────────────────────────────
    // ACCEPT CALL
    // ─────────────────────────────────────────────────────

    async accept(
        callId: string,
        userId: string,
        io: any,
    ): Promise<{ success: boolean; reason?: string }> {

        const accepted = await callStateMachine.acceptCall(callId, userId);
        if (!accepted) {
            return { success: false, reason: 'CANNOT_ACCEPT' };
        }

        const call = await callStateMachine.getCall(callId);
        if (!call) {
            return { success: false, reason: 'CALL_NOT_FOUND' };
        }

        // Notify caller that call was accepted
        const acceptedEvent: SignalEvent = {
            type: 'CALL_ACCEPTED',
            callId,
            senderId: userId,
            timestamp: Date.now(),
            payload: {
                callType: call.callType,
                mediaMode: call.mediaMode,
            },
        };
        await signalPublisher.publishToUser(call.callerId, acceptedEvent);

        // Track call start time
        await redis.set(`call_start:${callId}`, Date.now().toString(), 'EX', 7200);

        // Transition to CONNECTING
        await callStateMachine.transition(callId, 'ACCEPTED', 'CONNECTING');

        // Publish analytics event
        await signalPublisher.publishCallEvent({
            type: 'CALL_ACCEPTED',
            callId,
            callerId: call.callerId,
            receiverId: call.receiverId,
            callType: call.callType,
            region: LOCAL_REGION,
        });

        return { success: true };
    }

    // ─────────────────────────────────────────────────────
    // REJECT CALL
    // ─────────────────────────────────────────────────────

    async reject(
        callId: string,
        userId: string,
        reason: string = 'DECLINED',
        io: any,
    ): Promise<{ success: boolean }> {

        const call = await callStateMachine.getCall(callId);
        if (!call) return { success: false };

        const transitioned = await callStateMachine.transition(callId, 'RINGING', 'REJECTED', {
            endReason: reason,
            endedAt: Date.now().toString(),
        });

        if (!transitioned) return { success: false };

        // Notify caller
        const rejectedEvent: SignalEvent = {
            type: 'CALL_REJECTED',
            callId,
            senderId: userId,
            timestamp: Date.now(),
            payload: { reason },
        };
        await signalPublisher.publishToUser(call.callerId, rejectedEvent);

        // Persist to DB
        await this.persistCallHistory(call.callerId, call.receiverId, call.callType, 'REJECTED');

        // Log to chat
        await this.logCallToChat(call.callerId, call.receiverId, 'DECLINED', 0, call.callType, io);

        // Increment caller spam score on repeated rejections
        await callAuthorization.incrementSpamScore(call.callerId, 5);

        // Cleanup
        await this.cleanup(callId, call.callerId, call.receiverId);

        return { success: true };
    }

    // ─────────────────────────────────────────────────────
    // END CALL
    // ─────────────────────────────────────────────────────

    async end(
        callId: string,
        userId: string,
        io: any,
    ): Promise<{ success: boolean }> {

        const call = await callStateMachine.getCall(callId);
        if (!call) return { success: false };

        // Calculate duration
        const startStr = await redis.get(`call_start:${callId}`);
        const durationSeconds = startStr ? Math.floor((Date.now() - parseInt(startStr)) / 1000) : 0;

        // Transition to ENDED from any non-terminal state
        const currentState = call.state;
        const endableStates: CallState[] = [
            'CONNECTED', 'AUDIO_ONLY_CONNECTED', 'VIDEO_CONNECTED',
            'DEGRADED', 'RECONNECTING', 'ICE_NEGOTIATION', 'CONNECTING',
            'VIDEO_UPGRADING',
        ];

        if (endableStates.includes(currentState)) {
            await callStateMachine.transition(callId, currentState, 'ENDED', {
                endReason: 'USER_ENDED',
                endedAt: Date.now().toString(),
            });
        } else if (currentState === 'RINGING') {
            // Caller cancelled before answer → MISSED
            await callStateMachine.transition(callId, 'RINGING', 'MISSED');
        }

        // Determine target user to notify
        const targetUserId = userId === call.callerId ? call.receiverId : call.callerId;

        // Notify the other party
        const endedEvent: SignalEvent = {
            type: 'CALL_ENDED',
            callId,
            senderId: userId,
            timestamp: Date.now(),
            payload: { reason: 'USER_ENDED', durationSeconds },
        };
        await signalPublisher.publishToUser(targetUserId, endedEvent);

        // Persist
        const status = currentState === 'RINGING' ? 'MISSED' : 'COMPLETED';
        await this.persistCallHistory(call.callerId, call.receiverId, call.callType, status, durationSeconds);

        // Log to chat
        await this.logCallToChat(call.callerId, call.receiverId, status, durationSeconds, call.callType, io);

        // Release TURN allocation
        await turnService.releaseAllocation(call.callerId);
        await turnService.releaseAllocation(call.receiverId);

        // Cleanup
        await this.cleanup(callId, call.callerId, call.receiverId);

        return { success: true };
    }

    // ─────────────────────────────────────────────────────
    // WEBRTC RELAY (Offer / Answer / ICE)
    // ─────────────────────────────────────────────────────

    async relayOffer(
        senderId: string,
        input: { callId: string; targetUserId: string; sdp: unknown },
    ): Promise<boolean> {
        if (!await signalingRateLimiter.checkLimit(senderId, 'webrtc:offer')) return false;
        if (!signalingRateLimiter.validatePayloadSize('webrtc:offer', input.sdp)) return false;

        const event: SignalEvent = {
            type: 'WEBRTC_OFFER',
            callId: input.callId,
            senderId,
            timestamp: Date.now(),
            payload: { sdp: input.sdp },
        };
        return signalPublisher.publishToUser(input.targetUserId, event);
    }

    async relayAnswer(
        senderId: string,
        input: { callId: string; targetUserId: string; sdp: unknown },
    ): Promise<boolean> {
        if (!await signalingRateLimiter.checkLimit(senderId, 'webrtc:answer')) return false;

        // Transition to ICE_NEGOTIATION when answer is relayed
        const call = await callStateMachine.getCall(input.callId);
        if (call && call.state === 'CONNECTING') {
            await callStateMachine.transition(input.callId, 'CONNECTING', 'ICE_NEGOTIATION');
        }

        // Flush any buffered ICE candidates
        await this.flushIceBuffer(input.callId, input.targetUserId);

        const event: SignalEvent = {
            type: 'WEBRTC_ANSWER',
            callId: input.callId,
            senderId,
            timestamp: Date.now(),
            payload: { sdp: input.sdp },
        };
        return signalPublisher.publishToUser(input.targetUserId, event);
    }

    async relayIceCandidate(
        senderId: string,
        input: { callId: string; targetUserId: string; candidate: unknown },
    ): Promise<boolean> {
        if (!await signalingRateLimiter.checkLimit(senderId, 'webrtc:ice-candidate')) return false;
        if (!signalingRateLimiter.validatePayloadSize('webrtc:ice-candidate', input.candidate)) return false;

        // Check if we should buffer the candidate
        const call = await callStateMachine.getCall(input.callId);
        if (call && call.state === 'CONNECTING') {
            // Remote description not yet applied — buffer
            await redis.rpush(`ice:${input.callId}:buffer`, JSON.stringify(input.candidate));
            await redis.expire(`ice:${input.callId}:buffer`, 60);
            return true;
        }

        const event: SignalEvent = {
            type: 'ICE_CANDIDATE',
            callId: input.callId,
            senderId,
            timestamp: Date.now(),
            payload: { candidate: input.candidate },
        };
        return signalPublisher.publishToUser(input.targetUserId, event);
    }

    // ─────────────────────────────────────────────────────
    // CONNECTION STATE UPDATES
    // ─────────────────────────────────────────────────────

    /**
     * Called when ICE negotiation completes and media starts flowing.
     * Transitions to AUDIO_ONLY_CONNECTED or VIDEO_CONNECTED based on call type.
     */
    async onConnected(callId: string): Promise<void> {
        const call = await callStateMachine.getCall(callId);
        if (!call) return;

        if (call.state === 'ICE_NEGOTIATION') {
            // Determine target state based on mediaMode
            const targetState: CallState = call.mediaMode === 'AUDIO_VIDEO'
                ? 'VIDEO_CONNECTED'
                : 'AUDIO_ONLY_CONNECTED';

            await callStateMachine.transition(callId, 'ICE_NEGOTIATION', targetState, {
                connectedAt: Date.now().toString(),
            });
        } else if (call.state === 'RECONNECTING') {
            // After ICE restart — restore to appropriate connected state
            const targetState: CallState = call.mediaMode === 'AUDIO_VIDEO'
                ? 'VIDEO_CONNECTED'
                : 'AUDIO_ONLY_CONNECTED';

            await callStateMachine.transition(callId, 'RECONNECTING', targetState);
        }
    }

    async onCallHeartbeat(callId: string): Promise<void> {
        await callStateMachine.heartbeat(callId);
    }

    async onQualityReport(report: CallQualityReport): Promise<void> {
        await callQualityService.ingest(report);

        const call = await callStateMachine.getCall(report.callId);
        if (!call) return;

        // Check for degradation
        if (callQualityService.isDegraded(report)) {
            const activeMediaStates: CallState[] = ['AUDIO_ONLY_CONNECTED', 'VIDEO_CONNECTED', 'CONNECTED'];
            if (activeMediaStates.includes(call.state)) {
                await callStateMachine.transition(report.callId, call.state, 'DEGRADED');

                // Get bandwidth analysis for recommendations
                const analysis = callQualityService.analyzeBandwidth(report);

                // Notify both users with adaptive bitrate recommendations
                const degradedEvent: SignalEvent = {
                    type: 'CALL_QUALITY_DEGRADED',
                    callId: report.callId,
                    senderId: 'system',
                    timestamp: Date.now(),
                    payload: {
                        shouldFallbackToAudio: analysis.shouldFallbackToAudio,
                        bandwidthTier: analysis.tier,
                        recommendedOpusMode: analysis.recommendedOpusMode,
                        recommendedVideoResolution: analysis.recommendedVideoResolution,
                        packetLossStrategy: callQualityService.getPacketLossStrategy(report),
                    },
                };
                await signalPublisher.publishToUser(call.callerId, degradedEvent);
                await signalPublisher.publishToUser(call.receiverId, degradedEvent);

                // Auto-downgrade to audio if bandwidth is critical
                if (analysis.shouldFallbackToAudio && call.mediaMode === 'AUDIO_VIDEO') {
                    await this.downgradeToAudio(report.callId, 'system');
                }
            }
        } else if (call.state === 'DEGRADED') {
            // Quality recovered — transition back to appropriate connected state
            const targetState: CallState = call.mediaMode === 'AUDIO_VIDEO'
                ? 'VIDEO_CONNECTED'
                : 'AUDIO_ONLY_CONNECTED';

            await callStateMachine.transition(report.callId, 'DEGRADED', targetState);
        }
    }

    // ─────────────────────────────────────────────────────
    // VIDEO UPGRADE (Audio → Video mid-call)
    // ─────────────────────────────────────────────────────

    /**
     * Request a video upgrade during an audio-only call
     */
    async requestUpgrade(
        callId: string,
        userId: string,
    ): Promise<{ success: boolean; reason?: string }> {

        const call = await callStateMachine.getCall(callId);
        if (!call) return { success: false, reason: 'CALL_NOT_FOUND' };

        // Verify user is a participant
        if (call.callerId !== userId && call.receiverId !== userId) {
            return { success: false, reason: 'NOT_A_PARTICIPANT' };
        }

        // Atomic upgrade request (handles conflicts)
        const result = await callStateMachine.requestVideoUpgrade(callId, userId);

        if (result === 'UPGRADE_IN_PROGRESS') {
            return { success: false, reason: 'UPGRADE_IN_PROGRESS' };
        }
        if (result === 'INVALID_STATE') {
            return { success: false, reason: 'INVALID_STATE' };
        }

        // Notify the other party
        const targetUserId = userId === call.callerId ? call.receiverId : call.callerId;
        const upgradeEvent: SignalEvent = {
            type: 'VIDEO_UPGRADE_REQUEST',
            callId,
            senderId: userId,
            timestamp: Date.now(),
            payload: {},
        };
        await signalPublisher.publishToUser(targetUserId, upgradeEvent);

        // Publish analytics
        await signalPublisher.publishCallEvent({
            type: 'VIDEO_UPGRADE_REQUESTED',
            callId,
            callerId: call.callerId,
            receiverId: call.receiverId,
            callType: call.callType,
            region: LOCAL_REGION,
            metadata: { requestedBy: userId },
        });

        return { success: true };
    }

    /**
     * Accept a video upgrade request
     */
    async acceptUpgrade(
        callId: string,
        userId: string,
    ): Promise<{ success: boolean; reason?: string }> {

        const call = await callStateMachine.getCall(callId);
        if (!call) return { success: false, reason: 'CALL_NOT_FOUND' };
        if (call.state !== 'VIDEO_UPGRADING') {
            return { success: false, reason: 'NO_PENDING_UPGRADE' };
        }

        // Notify the upgrade requester to start SDP renegotiation with video
        const targetUserId = userId === call.callerId ? call.receiverId : call.callerId;
        const acceptEvent: SignalEvent = {
            type: 'VIDEO_UPGRADE_ACCEPTED',
            callId,
            senderId: userId,
            timestamp: Date.now(),
            payload: {},
        };
        await signalPublisher.publishToUser(targetUserId, acceptEvent);

        // Note: State stays VIDEO_UPGRADING until completeUpgrade() is called
        // after the SDP renegotiation with video is done

        return { success: true };
    }

    /**
     * Reject a video upgrade request — revert to audio
     */
    async rejectUpgrade(
        callId: string,
        userId: string,
    ): Promise<{ success: boolean }> {

        const call = await callStateMachine.getCall(callId);
        if (!call) return { success: false };
        if (call.state !== 'VIDEO_UPGRADING') return { success: false };

        // Revert to AUDIO_ONLY_CONNECTED
        await callStateMachine.revertUpgrade(callId);

        // Notify the requester
        const targetUserId = userId === call.callerId ? call.receiverId : call.callerId;
        const rejectEvent: SignalEvent = {
            type: 'VIDEO_UPGRADE_REJECTED',
            callId,
            senderId: userId,
            timestamp: Date.now(),
            payload: { reason: 'USER_REJECTED' },
        };
        await signalPublisher.publishToUser(targetUserId, rejectEvent);

        return { success: true };
    }

    /**
     * Complete the video upgrade after SDP renegotiation succeeds
     * Called by client after addTrack + offer/answer exchange is done
     */
    async completeUpgrade(callId: string): Promise<{ success: boolean }> {

        const completed = await callStateMachine.completeVideoUpgrade(callId);
        if (!completed) return { success: false };

        const call = await callStateMachine.getCall(callId);
        if (!call) return { success: false };

        // Notify both parties of media mode change
        const modeChangeEvent: SignalEvent = {
            type: 'MEDIA_MODE_CHANGED',
            callId,
            senderId: 'system',
            timestamp: Date.now(),
            payload: { mediaMode: 'AUDIO_VIDEO' },
        };
        await signalPublisher.publishToUser(call.callerId, modeChangeEvent);
        await signalPublisher.publishToUser(call.receiverId, modeChangeEvent);

        // Analytics
        await signalPublisher.publishCallEvent({
            type: 'VIDEO_UPGRADE_COMPLETED',
            callId,
            callerId: call.callerId,
            receiverId: call.receiverId,
            callType: 'VIDEO',
            region: LOCAL_REGION,
        });

        return { success: true };
    }

    // ─────────────────────────────────────────────────────
    // VIDEO DOWNGRADE (Video → Audio mid-call)
    // ─────────────────────────────────────────────────────

    /**
     * Downgrade from video to audio-only
     * Can be triggered by user choice or by system (bandwidth critical)
     */
    async downgradeToAudio(
        callId: string,
        triggeredBy: string,
    ): Promise<{ success: boolean }> {

        const call = await callStateMachine.getCall(callId);
        if (!call) return { success: false };

        const downgraded = await callStateMachine.downgradeToAudio(callId);
        if (!downgraded) return { success: false };

        // Notify both parties
        const downgradeEvent: SignalEvent = {
            type: 'VIDEO_DOWNGRADE',
            callId,
            senderId: triggeredBy,
            timestamp: Date.now(),
            payload: {
                reason: triggeredBy === 'system' ? 'BANDWIDTH_CRITICAL' : 'USER_CHOICE',
                mediaMode: 'AUDIO_ONLY',
            },
        };
        await signalPublisher.publishToUser(call.callerId, downgradeEvent);
        await signalPublisher.publishToUser(call.receiverId, downgradeEvent);

        // Notify with media mode change
        const modeChangeEvent: SignalEvent = {
            type: 'MEDIA_MODE_CHANGED',
            callId,
            senderId: 'system',
            timestamp: Date.now(),
            payload: { mediaMode: 'AUDIO_ONLY' },
        };
        await signalPublisher.publishToUser(call.callerId, modeChangeEvent);
        await signalPublisher.publishToUser(call.receiverId, modeChangeEvent);

        // Analytics
        await signalPublisher.publishCallEvent({
            type: 'VIDEO_DOWNGRADE',
            callId,
            callerId: call.callerId,
            receiverId: call.receiverId,
            callType: call.callType,
            region: LOCAL_REGION,
            metadata: { triggeredBy, reason: triggeredBy === 'system' ? 'BANDWIDTH_CRITICAL' : 'USER_CHOICE' },
        });

        return { success: true };
    }

    // ─────────────────────────────────────────────────────
    // ICE RESTART (RECONNECTING)
    // ─────────────────────────────────────────────────────

    async requestIceRestart(callId: string, userId: string): Promise<boolean> {
        const call = await callStateMachine.getCall(callId);
        if (!call) return false;

        const reconnectableStates: CallState[] = [
            'CONNECTED', 'AUDIO_ONLY_CONNECTED', 'VIDEO_CONNECTED', 'DEGRADED',
        ];

        if (reconnectableStates.includes(call.state)) {
            await callStateMachine.transition(callId, call.state, 'RECONNECTING');

            const targetUserId = userId === call.callerId ? call.receiverId : call.callerId;
            const event: SignalEvent = {
                type: 'ICE_RESTART',
                callId,
                senderId: userId,
                timestamp: Date.now(),
                payload: { mediaMode: call.mediaMode },
            };
            await signalPublisher.publishToUser(targetUserId, event);
            return true;
        }
        return false;
    }

    // ─────────────────────────────────────────────────────
    // GET TURN CREDENTIALS (with cross-region awareness)
    // ─────────────────────────────────────────────────────

    /**
     * Issue TURN credentials with optional cross-region optimization
     */
    async getTurnCredentials(
        userId: string,
        callId?: string,
    ): Promise<{ success: boolean; credentials?: any; error?: string }> {
        try {
            let credentials;

            if (callId) {
                // If we have a callId, optimize TURN selection for the call's regions
                const call = await callStateMachine.getCall(callId);
                if (call) {
                    const callerLocation = await presenceService.resolveUserLocation(call.callerId);
                    const calleeLocation = await presenceService.resolveUserLocation(call.receiverId);
                    const callerRegion = callerLocation?.region || LOCAL_REGION;
                    const calleeRegion = calleeLocation?.region || LOCAL_REGION;

                    credentials = await turnService.issueForCall(userId, callerRegion, calleeRegion);
                } else {
                    credentials = await turnService.issue(userId);
                }
            } else {
                credentials = await turnService.issue(userId);
            }

            return { success: true, credentials };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    // ─────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────

    private async cleanup(callId: string, callerId: string, receiverId: string): Promise<void> {
        await callStateMachine.clearUserActiveCall(callerId);
        await callStateMachine.clearUserActiveCall(receiverId);
        await callStateMachine.releaseLock(callerId, receiverId);
        await redis.del(`call_start:${callId}`);
        await redis.del(`ice:${callId}:buffer`);
    }

    private async flushIceBuffer(callId: string, targetUserId: string): Promise<void> {
        const buffered = await redis.lrange(`ice:${callId}:buffer`, 0, -1);
        await redis.del(`ice:${callId}:buffer`);

        for (const raw of buffered) {
            const event: SignalEvent = {
                type: 'ICE_CANDIDATE',
                callId,
                senderId: 'buffered',
                timestamp: Date.now(),
                payload: { candidate: JSON.parse(raw) },
            };
            await signalPublisher.publishToUser(targetUserId, event);
        }
    }

    private async persistCallHistory(
        callerId: string,
        receiverId: string,
        callType: CallType,
        status: string,
        durationSeconds: number = 0,
    ): Promise<void> {
        try {
            await db.insert(callHistory).values({
                callerId,
                receiverId,
                callType,
                status: status as any,
                durationSeconds,
                endedAt: new Date(),
            }).onConflictDoNothing();
        } catch (err) {
            console.error('[CallCoordinator] Failed to persist call history:', err);
        }
    }

    private async logMissedCall(
        callerId: string,
        targetUserId: string,
        callType: CallType,
        io: any,
    ): Promise<void> {
        await this.persistCallHistory(callerId, targetUserId, callType, 'MISSED');
        await this.logCallToChat(callerId, targetUserId, 'MISSED', 0, callType, io);
        await callAuthorization.incrementSpamScore(callerId, 2);
    }

    private async logCallToChat(
        fromId: string,
        toId: string,
        status: string,
        duration: number,
        callType: CallType,
        io: any,
    ): Promise<void> {
        try {
            const room = await chatRepository.findOrCreateDirectRoom(fromId, toId);
            let content = '';

            if (status === 'MISSED') content = `Missed ${callType.toLowerCase()} call`;
            else if (status === 'DECLINED') content = `Declined ${callType.toLowerCase()} call`;
            else if (status === 'COMPLETED') {
                const mins = Math.floor(duration / 60);
                const secs = duration % 60;
                const durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
                content = `${callType.charAt(0).toUpperCase() + callType.slice(1).toLowerCase()} call ended • ${durationStr}`;
            }

            if (content) {
                const msg = await chatRepository.saveMessage({
                    roomId: room._id.toString(),
                    senderId: fromId,
                    content,
                    type: MessageType.SYSTEM,
                });

                if (io) {
                    const event = { type: 'NEW_MESSAGE', payload: msg };
                    io.to(`u:${fromId}`).emit('event', event);
                    io.to(`u:${toId}`).emit('event', event);
                }
            }
        } catch (err) {
            console.error('[CallCoordinator] Failed to log call to chat:', err);
        }
    }
}

export const callCoordinator = new CallCoordinator();
