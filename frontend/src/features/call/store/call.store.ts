/**
 * Call Store — Zustand-based call state management
 * 15-state machine with voice/video distinction, upgrade tracking,
 * call timer, network quality, and double-click prevention.
 */

import { create } from 'zustand';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export type CallStatus =
    | 'IDLE'
    | 'INITIATING'
    | 'RINGING'
    | 'INCOMING'
    | 'ACCEPTED'
    | 'REJECTED'
    | 'CONNECTING'
    | 'ICE_NEGOTIATION'
    | 'AUDIO_CONNECTED'
    | 'VIDEO_CONNECTED'
    | 'VIDEO_UPGRADING'
    | 'DEGRADED'
    | 'RECONNECTING'
    | 'ENDED'
    | 'FAILED';

export type CallType = 'AUDIO' | 'VIDEO';
export type MediaMode = 'AUDIO_ONLY' | 'AUDIO_VIDEO';
export type NetworkQuality = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL' | 'UNKNOWN';

export interface CallParticipant {
    id: string;
    name: string;
    username?: string;
    avatar?: string;
}

export interface IncomingCallData {
    callId: string;
    callerId: string;
    callerName: string;
    callerAvatar?: string;
    callerUsername?: string;
    callType: CallType;
}

export interface CallState {
    // ── Call Lifecycle State ──
    status: CallStatus;
    callId: string | null;
    callType: CallType;
    mediaMode: MediaMode;
    caller: CallParticipant | null;
    receiver: CallParticipant | null;
    direction: 'OUTGOING' | 'INCOMING' | null;

    // ── Incoming call data ──
    incomingCall: IncomingCallData | null;

    // ── Media state ──
    isMuted: boolean;
    isCameraOff: boolean;
    isSpeakerOn: boolean;
    isFullscreen: boolean;

    // ── Network quality indicators ──
    networkQuality: NetworkQuality;
    rtt: number;
    jitter: number;
    packetLoss: number;

    // ── Call timer ──
    callStartTime: number | null;
    callDuration: number;

    // ── Upgrade state ──
    upgradeRequested: boolean;
    upgradeRequestedBy: string | null;
    upgradeDirection: 'SENT' | 'RECEIVED' | null;

    // ── Error state ──
    errorMessage: string | null;

    // ── Lock for double-click prevention ── 
    actionLock: boolean;

    // ── Actions ──
    setStatus: (status: CallStatus) => void;
    setCallData: (data: { callId: string; callType: CallType; direction: 'OUTGOING' | 'INCOMING'; participant: CallParticipant }) => void;
    setIncomingCall: (data: IncomingCallData | null) => void;
    setMediaMode: (mode: MediaMode) => void;

    toggleMute: () => void;
    toggleCamera: () => void;
    toggleSpeaker: () => void;
    toggleFullscreen: () => void;

    setNetworkQuality: (quality: NetworkQuality, metrics?: { rtt?: number; jitter?: number; packetLoss?: number }) => void;

    startCallTimer: () => void;
    tickCallTimer: () => void;

    setUpgradeState: (requested: boolean, by: string | null, direction: 'SENT' | 'RECEIVED' | null) => void;
    setError: (message: string | null) => void;
    setActionLock: (locked: boolean) => void;

    reset: () => void;
}

// ─────────────────────────────────────────────────────────────────
// Valid Transitions (frontend-side)
// ─────────────────────────────────────────────────────────────────

const VALID_TRANSITIONS: Partial<Record<CallStatus, CallStatus[]>> = {
    IDLE: ['INITIATING', 'INCOMING'],
    INITIATING: ['RINGING', 'FAILED', 'ENDED'],
    RINGING: ['ACCEPTED', 'REJECTED', 'ENDED', 'FAILED'],
    INCOMING: ['ACCEPTED', 'REJECTED', 'ENDED'],
    ACCEPTED: ['CONNECTING', 'FAILED'],
    CONNECTING: ['ICE_NEGOTIATION', 'FAILED', 'ENDED'],
    ICE_NEGOTIATION: ['AUDIO_CONNECTED', 'VIDEO_CONNECTED', 'FAILED'],
    AUDIO_CONNECTED: ['VIDEO_UPGRADING', 'DEGRADED', 'RECONNECTING', 'ENDED', 'FAILED'],
    VIDEO_CONNECTED: ['AUDIO_CONNECTED', 'DEGRADED', 'RECONNECTING', 'ENDED', 'FAILED'],
    VIDEO_UPGRADING: ['VIDEO_CONNECTED', 'AUDIO_CONNECTED', 'FAILED', 'ENDED'],
    DEGRADED: ['AUDIO_CONNECTED', 'VIDEO_CONNECTED', 'RECONNECTING', 'ENDED', 'FAILED'],
    RECONNECTING: ['AUDIO_CONNECTED', 'VIDEO_CONNECTED', 'FAILED', 'ENDED'],
    REJECTED: ['IDLE'],
    ENDED: ['IDLE'],
    FAILED: ['IDLE'],
};

// ─────────────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────────────

const initialState = {
    status: 'IDLE' as CallStatus,
    callId: null as string | null,
    callType: 'AUDIO' as CallType,
    mediaMode: 'AUDIO_ONLY' as MediaMode,
    caller: null as CallParticipant | null,
    receiver: null as CallParticipant | null,
    direction: null as 'OUTGOING' | 'INCOMING' | null,
    incomingCall: null as IncomingCallData | null,
    isMuted: false,
    isCameraOff: false,
    isSpeakerOn: true,
    isFullscreen: false,
    networkQuality: 'UNKNOWN' as NetworkQuality,
    rtt: 0,
    jitter: 0,
    packetLoss: 0,
    callStartTime: null as number | null,
    callDuration: 0,
    upgradeRequested: false,
    upgradeRequestedBy: null as string | null,
    upgradeDirection: null as 'SENT' | 'RECEIVED' | null,
    errorMessage: null as string | null,
    actionLock: false,
};

// ─────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────

export const useCallStore = create<CallState>((set, get) => ({
    ...initialState,

    setStatus: (status) => {
        const current = get().status;

        // Validate transition (allow any → IDLE for resets)
        if (status !== 'IDLE') {
            const valid = VALID_TRANSITIONS[current];
            if (valid && !valid.includes(status)) {
                console.warn(`[CallStore] Invalid transition: ${current} → ${status}`);
                return;
            }
        }

        set({ status });
    },

    setCallData: ({ callId, callType, direction, participant }) => {
        const mediaMode: MediaMode = callType === 'VIDEO' ? 'AUDIO_VIDEO' : 'AUDIO_ONLY';
        set({
            callId,
            callType,
            mediaMode,
            direction,
            ...(direction === 'OUTGOING' ? { receiver: participant } : { caller: participant }),
        });
    },

    setIncomingCall: (data) => set({ incomingCall: data }),
    setMediaMode: (mode) => set({ mediaMode: mode }),

    toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
    toggleCamera: () => set((s) => ({ isCameraOff: !s.isCameraOff })),
    toggleSpeaker: () => set((s) => ({ isSpeakerOn: !s.isSpeakerOn })),
    toggleFullscreen: () => set((s) => ({ isFullscreen: !s.isFullscreen })),

    setNetworkQuality: (quality, metrics) =>
        set({
            networkQuality: quality,
            ...(metrics?.rtt !== undefined && { rtt: metrics.rtt }),
            ...(metrics?.jitter !== undefined && { jitter: metrics.jitter }),
            ...(metrics?.packetLoss !== undefined && { packetLoss: metrics.packetLoss }),
        }),

    startCallTimer: () => set({ callStartTime: Date.now(), callDuration: 0 }),

    tickCallTimer: () => {
        const { callStartTime } = get();
        if (callStartTime) {
            set({ callDuration: Math.floor((Date.now() - callStartTime) / 1000) });
        }
    },

    setUpgradeState: (requested, by, direction) =>
        set({ upgradeRequested: requested, upgradeRequestedBy: by, upgradeDirection: direction }),

    setError: (message) => set({ errorMessage: message }),
    setActionLock: (locked) => set({ actionLock: locked }),

    reset: () => set(initialState),
}));
