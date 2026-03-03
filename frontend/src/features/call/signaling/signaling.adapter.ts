/**
 * Signaling Adapter — WebSocket abstraction for call signaling
 * 
 * Wraps the existing SocketService with call-specific event routing.
 * Provides: typed event dispatch, idempotent processing via message IDs,
 * and structured event listeners for the call system.
 */

import { socketService } from '@/services/socket.service';
import type { CallType } from '../store/call.store';

// ─────────────────────────────────────────────────────────────────
// Outbound Signal Types (client → server)
// ─────────────────────────────────────────────────────────────────

export interface SignalingAdapter {
    // ── Call lifecycle ──
    initiateCall: (targetUserId: string, callType: CallType) => void;
    acceptCall: (callId: string, callerId: string, callType: CallType) => void;
    rejectCall: (callId: string, callerId: string, reason: string, callType: CallType) => void;
    endCall: (callId: string, targetUserId: string, callType: CallType) => void;

    // ── WebRTC signaling ──
    sendOffer: (callId: string, targetUserId: string, sdp: RTCSessionDescription) => void;
    sendAnswer: (callId: string, targetUserId: string, sdp: RTCSessionDescription) => void;
    sendIceCandidate: (callId: string, targetUserId: string, candidate: RTCIceCandidate) => void;

    // ── Call connected & heartbeat ──
    sendConnected: (callId: string) => void;
    sendHeartbeat: (callId: string) => void;
    sendIceRestart: (callId: string) => void;

    // ── Video upgrade/downgrade ──
    sendUpgradeRequest: (callId: string) => void;
    sendUpgradeAccept: (callId: string) => void;
    sendUpgradeReject: (callId: string) => void;
    sendUpgradeComplete: (callId: string) => void;
    sendDowngradeAudio: (callId: string) => void;
    sendVideoToggle: (callId: string, enabled: boolean) => void;

    // ── Quality report ──
    sendQualityReport: (report: QualityReport) => void;

    // ── TURN credentials (callback-style) ──
    requestTurnCredentials: (callId?: string) => Promise<TurnCredentialsResponse>;

    // ── Event listeners ──
    on: (event: string, handler: (data: any) => void) => void;
    off: (event: string, handler: (data: any) => void) => void;
}

interface QualityReport {
    callId: string;
    userId: string;
    timestamp: number;
    audio?: {
        jitter: number;
        packetLoss: number;
        roundTripTime: number;
        codec: string;
    };
    video?: {
        frameRate: number;
        resolution: string;
        bandwidth: number;
        codec: string;
    };
}

interface TurnCredentialsResponse {
    success: boolean;
    credentials?: {
        urls: string[];
        username: string;
        credential: string;
        ttl: number;
    };
    error?: string;
}

// Processed message IDs for idempotent processing
const processedMessages = new Set<string>();
const MAX_PROCESSED_CACHE = 1000;

function isProcessed(messageId: string): boolean {
    if (processedMessages.has(messageId)) return true;
    processedMessages.add(messageId);
    if (processedMessages.size > MAX_PROCESSED_CACHE) {
        const first = processedMessages.values().next().value;
        if (first) processedMessages.delete(first);
    }
    return false;
}

// ─────────────────────────────────────────────────────────────────
// Signaling Adapter Implementation
// ─────────────────────────────────────────────────────────────────

export const signalingAdapter: SignalingAdapter = {
    // ── Call Lifecycle ──

    initiateCall: (targetUserId, callType) => {
        socketService.send('call:initiate', { targetUserId, callType });
    },

    acceptCall: (callId, callerId, callType) => {
        socketService.send('call:accept', { callId, callerId, callType });
    },

    rejectCall: (callId, callerId, reason, callType) => {
        socketService.send('call:reject', { callId, callerId, reason, callType });
    },

    endCall: (callId, targetUserId, callType) => {
        socketService.send('call:end', { callId, targetUserId, callType });
    },

    // ── WebRTC Signaling ──

    sendOffer: (callId, targetUserId, sdp) => {
        socketService.send('webrtc:offer', { callId, targetUserId, sdp });
    },

    sendAnswer: (callId, targetUserId, sdp) => {
        socketService.send('webrtc:answer', { callId, targetUserId, sdp });
    },

    sendIceCandidate: (callId, targetUserId, candidate) => {
        socketService.send('webrtc:ice-candidate', { callId, targetUserId, candidate });
    },

    // ── Call State ──

    sendConnected: (callId) => {
        socketService.send('call:connected', { callId });
    },

    sendHeartbeat: (callId) => {
        socketService.send('call:heartbeat', { callId });
    },

    sendIceRestart: (callId) => {
        socketService.send('call:ice-restart', { callId });
    },

    // ── Video Upgrade/Downgrade ──

    sendUpgradeRequest: (callId) => {
        socketService.send('call:upgrade-request', { callId });
    },

    sendUpgradeAccept: (callId) => {
        socketService.send('call:upgrade-accept', { callId });
    },

    sendUpgradeReject: (callId) => {
        socketService.send('call:upgrade-reject', { callId });
    },

    sendUpgradeComplete: (callId) => {
        socketService.send('call:upgrade-complete', { callId });
    },

    sendDowngradeAudio: (callId) => {
        socketService.send('call:downgrade-audio', { callId });
    },

    sendVideoToggle: (callId, enabled) => {
        socketService.send('call:video-toggle', { callId, enabled });
    },

    // ── Quality Report ──

    sendQualityReport: (report) => {
        socketService.send('call:quality', report);
    },

    // ── TURN Credentials ──

    requestTurnCredentials: (callId?) => {
        return new Promise((resolve) => {
            const handler = (data: TurnCredentialsResponse) => {
                resolve(data);
                socketService.off('call:turn-credentials-response', handler);
            };
            socketService.on('call:turn-credentials-response', handler);
            socketService.send('call:get-turn-credentials', { callId });

            // Timeout fallback
            setTimeout(() => {
                socketService.off('call:turn-credentials-response', handler);
                resolve({ success: false, error: 'TIMEOUT' });
            }, 5000);
        });
    },

    // ── Event Listeners ──

    on: (event, handler) => {
        socketService.on(event, handler);
    },

    off: (event, handler) => {
        socketService.off(event, handler);
    },
};

// ─────────────────────────────────────────────────────────────────
// Signal Event Names (for type-safe subscriptions)
// ─────────────────────────────────────────────────────────────────

export const SIGNAL_EVENTS = {
    // Inbound from server
    CALL_INITIATED: 'call:initiated',
    CALL_INCOMING: 'call:signal',       // All call signals come via call:signal
    CALL_ACCEPTED: 'call:accepted',     // Direct Socket.IO event
    CALL_REJECTED: 'call:rejected',
    CALL_ENDED: 'call:ended',
    CALL_UPGRADE_FAILED: 'call:upgrade-failed',

    // WebRTC relay
    WEBRTC_OFFER: 'webrtc:offer',
    WEBRTC_ANSWER: 'webrtc:answer',
    ICE_CANDIDATE: 'webrtc:ice-candidate',

    // System
    SYSTEM_RECONNECT: 'system:reconnect',
    ERROR: 'error',
} as const;
