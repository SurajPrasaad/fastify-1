/**
 * Call Types — State Machine, Signal Events, Data Structures
 * Implements the 19-state call lifecycle with voice/video distinction
 * and dynamic mid-call upgrade/downgrade support.
 */

// ─────────────────────────────────────────────────────────────────
// Call States (19 states)
// ─────────────────────────────────────────────────────────────────

export const CALL_STATES = [
    'IDLE',
    'INITIATING',
    'SIGNALING',
    'RINGING',
    'ACCEPTED',
    'REJECTED',
    'TIMEOUT',
    'CONNECTING',
    'ICE_NEGOTIATION',
    'AUDIO_ONLY_CONNECTED',
    'VIDEO_CONNECTED',
    'VIDEO_UPGRADING',
    'CONNECTED',           // Legacy compat — maps to AUDIO_ONLY or VIDEO based on callType
    'DEGRADED',
    'RECONNECTING',
    'FAILED',
    'ENDED',
    'MISSED',
    'REGION_FAILOVER',
] as const;

export type CallState = (typeof CALL_STATES)[number];

export const TERMINAL_STATES: CallState[] = [
    'REJECTED', 'TIMEOUT', 'FAILED', 'ENDED', 'MISSED',
];

/** Connected states where media is flowing */
export const ACTIVE_MEDIA_STATES: CallState[] = [
    'AUDIO_ONLY_CONNECTED', 'VIDEO_CONNECTED', 'CONNECTED', 'DEGRADED',
];

export type CallType = 'AUDIO' | 'VIDEO';

/** Current media mode — tracks what's actually flowing vs call type */
export type MediaMode = 'AUDIO_ONLY' | 'AUDIO_VIDEO';

// ─────────────────────────────────────────────────────────────────
// Call Data (stored in Redis hash `call:{callId}`)
// ─────────────────────────────────────────────────────────────────

export interface CallData {
    callId: string;
    callerId: string;
    receiverId: string;
    callType: CallType;         // Original call type at initiation
    mediaMode: MediaMode;       // Current active media mode (may differ from callType after upgrade/downgrade)
    state: CallState;
    version: number;            // Monotonic version counter for split-brain detection
    region: string;             // Region where call was initiated
    createdAt: number;          // epoch ms
    acceptedAt?: number | undefined;
    acceptedBy?: string | undefined;     // deviceId that accepted
    connectedAt?: number | undefined;
    endedAt?: number | undefined;
    endReason?: string | undefined;
    lastHeartbeat?: number | undefined;
    upgradeRequestedBy?: string | undefined;   // userId who initiated video upgrade
    upgradeRequestedAt?: number | undefined;   // epoch ms of upgrade request
}

// ─────────────────────────────────────────────────────────────────
// Signal Events (transmitted via Redis pub/sub or Kafka)
// ─────────────────────────────────────────────────────────────────

export type SignalEventType =
    | 'CALL_INCOMING'
    | 'CALL_ACCEPTED'
    | 'CALL_REJECTED'
    | 'CALL_ENDED'
    | 'CALL_TIMEOUT'
    | 'CALL_MISSED'
    | 'CALL_HANDLED_ELSEWHERE'
    | 'CALL_QUEUED'
    | 'WEBRTC_OFFER'
    | 'WEBRTC_ANSWER'
    | 'ICE_CANDIDATE'
    | 'ICE_RESTART'
    | 'CALL_QUALITY_DEGRADED'
    | 'SYSTEM_RECONNECT'
    | 'REGION_FAILOVER'
    // ── Video upgrade/downgrade events ──
    | 'VIDEO_UPGRADE_REQUEST'
    | 'VIDEO_UPGRADE_ACCEPTED'
    | 'VIDEO_UPGRADE_REJECTED'
    | 'VIDEO_UPGRADE_COMPLETE'
    | 'VIDEO_DOWNGRADE'
    | 'MEDIA_MODE_CHANGED';

export interface SignalEvent {
    type: SignalEventType;
    callId: string;
    senderId: string;
    timestamp: number;
    payload: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────
// User Location / Presence
// ─────────────────────────────────────────────────────────────────

export interface UserLocation {
    region: string;
    socketId: string | null;
    podId: string | null;
}

export interface PresenceData {
    region: string;
    podId: string;
    socketId: string;
    connectedAt: string;
    deviceType: string;
    lastHeartbeat: string;
}

// ─────────────────────────────────────────────────────────────────
// Authorization
// ─────────────────────────────────────────────────────────────────

export interface AuthResult {
    allowed: boolean;
    reason?: string | undefined;
}

// ─────────────────────────────────────────────────────────────────
// TURN Credentials
// ─────────────────────────────────────────────────────────────────

export interface TurnCredentials {
    urls: string[];
    username: string;
    credential: string;
    ttl: number;
}

// ─────────────────────────────────────────────────────────────────
// Call Quality Telemetry
// ─────────────────────────────────────────────────────────────────

export interface CallQualityReport {
    callId: string;
    userId: string;
    timestamp: number;
    audio?: {
        jitter: number;
        packetLoss: number;
        roundTripTime: number;
        codec: string;
        bitrate?: number;
    };
    video?: {
        frameRate: number;
        resolution: string;
        bandwidth: number;
        codec: string;
        packetLoss?: number;
    };
    ice?: {
        candidateType: string;
        localType: string;
        remoteType: string;
    };
    network?: {
        connectionType: string;
        effectiveType: string;
        downlink?: number;        // Mbps
    };
}

// ─────────────────────────────────────────────────────────────────
// Bandwidth Tiers (for adaptive bitrate decisions)
// ─────────────────────────────────────────────────────────────────

export type BandwidthTier = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';

export interface BandwidthAnalysis {
    tier: BandwidthTier;
    estimatedBandwidth: number;       // kbps
    recommendedOpusMode: OpusMode;
    recommendedVideoResolution: VideoResolution | null;
    shouldFallbackToAudio: boolean;
}

export interface OpusMode {
    mode: 'VBR' | 'CBR';
    bitrate: number;        // kbps
    packetTime: number;     // ms
    fec: boolean;
    dtx: boolean;           // Discontinuous transmission (silence detection)
}

export type VideoResolution = '1080p' | '720p' | '480p' | '360p' | '240p';

export interface VideoRecommendation {
    resolution: VideoResolution;
    framerate: number;
    bitrate: number;       // kbps
}

// ─────────────────────────────────────────────────────────────────
// Video Upgrade Request
// ─────────────────────────────────────────────────────────────────

export interface UpgradeRequest {
    callId: string;
    requestedBy: string;
    requestedAt: number;
}

// ─────────────────────────────────────────────────────────────────
// State Transition TTLs (seconds)
// ─────────────────────────────────────────────────────────────────

export const STATE_TTLS: Record<CallState, number> = {
    IDLE: 0,
    INITIATING: 10,
    SIGNALING: 15,
    RINGING: 30,
    ACCEPTED: 15,
    REJECTED: 5,
    TIMEOUT: 5,
    CONNECTING: 20,
    ICE_NEGOTIATION: 30,
    AUDIO_ONLY_CONNECTED: 7200,
    VIDEO_CONNECTED: 7200,
    VIDEO_UPGRADING: 15,
    CONNECTED: 7200,
    DEGRADED: 7200,
    RECONNECTING: 30,
    FAILED: 10,
    ENDED: 10,
    MISSED: 5,
    REGION_FAILOVER: 60,
};

// ─────────────────────────────────────────────────────────────────
// Valid State Transitions Map
// ─────────────────────────────────────────────────────────────────

export const VALID_TRANSITIONS: Record<CallState, CallState[]> = {
    IDLE: ['INITIATING'],
    INITIATING: ['SIGNALING', 'FAILED', 'MISSED'],
    SIGNALING: ['RINGING', 'FAILED', 'MISSED'],
    RINGING: ['ACCEPTED', 'REJECTED', 'TIMEOUT', 'MISSED', 'REGION_FAILOVER'],
    ACCEPTED: ['CONNECTING', 'FAILED'],
    REJECTED: [],
    TIMEOUT: [],
    CONNECTING: ['ICE_NEGOTIATION', 'FAILED'],
    ICE_NEGOTIATION: ['AUDIO_ONLY_CONNECTED', 'VIDEO_CONNECTED', 'CONNECTED', 'FAILED'],

    // ── Audio-only connected state transitions ──
    AUDIO_ONLY_CONNECTED: [
        'VIDEO_UPGRADING',      // Mid-call upgrade to video
        'DEGRADED',             // Quality dropped
        'RECONNECTING',         // ICE restart
        'ENDED',                // Normal end
        'FAILED',               // Unrecoverable
        'REGION_FAILOVER',      // Region outage
    ],

    // ── Video connected state transitions ──
    VIDEO_CONNECTED: [
        'AUDIO_ONLY_CONNECTED', // Downgrade to audio (bandwidth/user choice)
        'DEGRADED',             // Quality dropped
        'RECONNECTING',         // ICE restart
        'ENDED',                // Normal end
        'FAILED',               // Unrecoverable
        'REGION_FAILOVER',      // Region outage
    ],

    // ── Video upgrade in progress ──
    VIDEO_UPGRADING: [
        'VIDEO_CONNECTED',      // Upgrade succeeded
        'AUDIO_ONLY_CONNECTED', // Upgrade failed/rejected — revert
        'FAILED',               // Unrecoverable
        'ENDED',                // User ended during upgrade
    ],

    // ── Legacy CONNECTED (backward compat) ──
    CONNECTED: ['DEGRADED', 'RECONNECTING', 'ENDED', 'FAILED', 'REGION_FAILOVER',
        'AUDIO_ONLY_CONNECTED', 'VIDEO_CONNECTED'],

    DEGRADED: ['AUDIO_ONLY_CONNECTED', 'VIDEO_CONNECTED', 'CONNECTED', 'RECONNECTING', 'ENDED', 'FAILED'],
    RECONNECTING: ['AUDIO_ONLY_CONNECTED', 'VIDEO_CONNECTED', 'CONNECTED', 'FAILED', 'ENDED'],
    FAILED: [],
    ENDED: [],
    MISSED: [],
    REGION_FAILOVER: ['CONNECTING', 'FAILED', 'ENDED'],
};
