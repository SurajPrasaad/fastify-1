"use client";

/**
 * Call Context — Production-grade call lifecycle orchestrator
 * 
 * Integrates:
 * - Zustand call store (state management)
 * - WebRTC engine (peer connection abstraction)
 * - Signaling adapter (WebSocket transport)
 *
 * Handles:
 * - Full 15-state call lifecycle
 * - Audio/video call initiation & acceptance
 * - Mid-call voice↔video upgrade
 * - ICE restart reconnection
 * - Network quality monitoring
 * - Call timer
 * - Heartbeat keep-alive
 * - Graceful cleanup on end/fail
 * - Edge cases (caller cancel, device removal, tab switch)
 */

import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useCallback,
    type ReactNode,
} from "react";
import { toast } from "sonner";
import { useCallStore, type CallType, type CallParticipant } from "../store/call.store";
import { WebRTCEngine, type TurnCredentials } from "../engine/webrtc.engine";
import { signalingAdapter, SIGNAL_EVENTS } from "../signaling/signaling.adapter";
import { socketService } from "@/services/socket.service";

// ─────────────────────────────────────────────────────────────────
// Context Interface
// ─────────────────────────────────────────────────────────────────

interface CallContextType {
    initiateCall: (targetUserId: string, targetName: string, targetAvatar: string | null, type: CallType) => void;
    acceptCall: () => void;
    rejectCall: () => void;
    endCall: () => void;
    toggleMute: () => void;
    toggleCamera: () => void;
    requestVideoUpgrade: () => void;
    acceptVideoUpgrade: () => void;
    rejectVideoUpgrade: () => void;
    downgradeToAudio: () => void;
    localStreamRef: React.MutableRefObject<MediaStream | null>;
    remoteStreamRef: React.MutableRefObject<MediaStream | null>;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────
// Audio cue refs
// ─────────────────────────────────────────────────────────────────

const RINGTONE_URL = "/sounds/ringtone.mp3";
const DIALTONE_URL = "/sounds/dialtone.mp3";
const ENDTONE_URL = "/sounds/endtone.mp3";

// ─────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────

export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const store = useCallStore;

    // ── Refs (never cause re-renders) ──
    const engineRef = useRef<WebRTCEngine | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);
    const ringtoneRef = useRef<HTMLAudioElement | null>(null);
    const dialtoneRef = useRef<HTMLAudioElement | null>(null);
    const endtoneRef = useRef<HTMLAudioElement | null>(null);
    const heartbeatInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Initialize audio elements ──
    useEffect(() => {
        if (typeof window === "undefined") return;
        ringtoneRef.current = new Audio(RINGTONE_URL);
        ringtoneRef.current.loop = true;
        dialtoneRef.current = new Audio(DIALTONE_URL);
        dialtoneRef.current.loop = true;
        endtoneRef.current = new Audio(ENDTONE_URL);

        return () => {
            ringtoneRef.current?.pause();
            dialtoneRef.current?.pause();
        };
    }, []);

    // ─────────────────────────────────────────────────────
    // Cleanup
    // ─────────────────────────────────────────────────────

    const cleanup = useCallback(() => {
        // Stop audio
        ringtoneRef.current?.pause();
        dialtoneRef.current?.pause();

        // Play end tone
        endtoneRef.current?.play().catch(() => { });

        // Stop heartbeat
        if (heartbeatInterval.current) {
            clearInterval(heartbeatInterval.current);
            heartbeatInterval.current = null;
        }

        // Stop timer
        if (timerInterval.current) {
            clearInterval(timerInterval.current);
            timerInterval.current = null;
        }

        // Stop reconnect
        if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
            reconnectTimeout.current = null;
        }

        // Destroy engine
        if (engineRef.current) {
            engineRef.current.destroy();
            engineRef.current = null;
        }

        localStreamRef.current = null;
        remoteStreamRef.current = null;

        // Reset store
        store.getState().reset();
    }, [store]);

    // ─────────────────────────────────────────────────────
    // Create WebRTC Engine
    // ─────────────────────────────────────────────────────

    const createEngine = useCallback((callType: CallType): WebRTCEngine => {
        const engine = new WebRTCEngine({
            onRemoteStream: (stream) => {
                remoteStreamRef.current = stream;

                // Force UI update for remote stream
                window.dispatchEvent(new CustomEvent('call:remote-stream-update'));
            },

            onIceCandidate: (candidate) => {
                const state = store.getState();
                if (state.callId) {
                    const target = state.direction === 'OUTGOING' ? state.receiver : state.caller;
                    if (target) {
                        signalingAdapter.sendIceCandidate(state.callId, target.id, candidate);
                    }
                }
            },

            onIceStateChange: (iceState) => {
                const state = store.getState();
                if (iceState === 'connected' || iceState === 'completed') {
                    // ICE succeeded — transition to connected
                    if (state.status === 'ICE_NEGOTIATION' || state.status === 'RECONNECTING') {
                        const targetStatus = state.mediaMode === 'AUDIO_VIDEO' ? 'VIDEO_CONNECTED' : 'AUDIO_CONNECTED';
                        store.getState().setStatus(targetStatus);
                        store.getState().startCallTimer();

                        // Notify backend
                        if (state.callId) {
                            signalingAdapter.sendConnected(state.callId);
                        }

                        // Start heartbeat
                        startHeartbeat();
                        // Start call timer
                        startTimer();
                    }
                } else if (iceState === 'disconnected') {
                    // ICE disconnected — attempt reconnect
                    const activeStates = ['AUDIO_CONNECTED', 'VIDEO_CONNECTED', 'DEGRADED'];
                    if (activeStates.includes(state.status)) {
                        store.getState().setStatus('RECONNECTING');
                        attemptReconnect();
                    }
                } else if (iceState === 'failed') {
                    // ICE failed — check if we should retry or fail
                    if (state.status === 'RECONNECTING') {
                        store.getState().setStatus('FAILED');
                        store.getState().setError('Connection lost');
                        toast.error('Call connection lost');
                        cleanup();
                    } else if (state.status === 'ICE_NEGOTIATION') {
                        // Try ICE restart once
                        attemptReconnect();
                    }
                }
            },

            onConnectionStateChange: (connState) => {
                if (connState === 'failed') {
                    const state = store.getState();
                    if (state.status !== 'ENDED' && state.status !== 'FAILED') {
                        store.getState().setStatus('FAILED');
                        store.getState().setError('Connection failed');
                        toast.error('Call failed');
                        cleanup();
                    }
                }
            },

            onNegotiationNeeded: () => {
                // Auto-renegotiation needed (e.g., after addTrack for video upgrade)
                // This is handled explicitly in the upgrade flow — no-op here
            },

            onQualityUpdate: (quality, metrics) => {
                store.getState().setNetworkQuality(quality, metrics);

                // Send quality report to server periodically
                const state = store.getState();
                if (state.callId) {
                    signalingAdapter.sendQualityReport({
                        callId: state.callId,
                        userId: '', // Will be set by server from session
                        timestamp: Date.now(),
                        audio: {
                            jitter: metrics.jitter,
                            packetLoss: metrics.packetLoss,
                            roundTripTime: metrics.rtt,
                            codec: 'opus',
                        },
                    });
                }
            },

            onTrackEnded: (kind) => {
                if (kind === 'video') {
                    toast.info('Camera disconnected');
                    store.getState().toggleCamera();
                } else if (kind === 'audio') {
                    toast.error('Microphone disconnected');
                    // End call if audio device removed
                    endCall();
                }
            },
        }, callType);

        engineRef.current = engine;
        return engine;
    }, [store, cleanup]);

    // ─────────────────────────────────────────────────────
    // Heartbeat & Timer
    // ─────────────────────────────────────────────────────

    const startHeartbeat = useCallback(() => {
        if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = setInterval(() => {
            const state = store.getState();
            if (state.callId) {
                signalingAdapter.sendHeartbeat(state.callId);
            }
        }, 15000); // 15s heartbeat
    }, [store]);

    const startTimer = useCallback(() => {
        if (timerInterval.current) clearInterval(timerInterval.current);
        timerInterval.current = setInterval(() => {
            store.getState().tickCallTimer();
        }, 1000);
    }, [store]);

    // ─────────────────────────────────────────────────────
    // ICE Restart / Reconnection
    // ─────────────────────────────────────────────────────

    const attemptReconnect = useCallback(() => {
        const state = store.getState();
        if (!engineRef.current || !state.callId) return;

        store.getState().setStatus('RECONNECTING');
        toast.info('Reconnecting...');

        // Request ICE restart via signaling
        signalingAdapter.sendIceRestart(state.callId);

        // Timeout after 15s
        reconnectTimeout.current = setTimeout(() => {
            const currentState = store.getState();
            if (currentState.status === 'RECONNECTING') {
                store.getState().setStatus('FAILED');
                store.getState().setError('Reconnection failed');
                toast.error('Could not reconnect');
                cleanup();
            }
        }, 15000);
    }, [store, cleanup]);

    // ─────────────────────────────────────────────────────
    // INITIATE CALL
    // ─────────────────────────────────────────────────────

    const initiateCall = useCallback(async (
        targetUserId: string,
        targetName: string,
        targetAvatar: string | null,
        type: CallType,
    ) => {
        const state = store.getState();

        // Double-click prevention
        if (state.actionLock || state.status !== 'IDLE') return;
        store.getState().setActionLock(true);

        try {
            // Create engine & acquire media
            const engine = createEngine(type);
            await engine.initialize(); // STUN by default, TURN requested after

            const stream = await engine.acquireMedia(type);
            localStreamRef.current = stream;
            engine.addLocalTracks();

            // Update store
            store.getState().setCallData({
                callId: '', // Set after server response
                callType: type,
                direction: 'OUTGOING',
                participant: { id: targetUserId, name: targetName, avatar: targetAvatar || undefined },
            });
            store.getState().setStatus('INITIATING');

            // Play dial tone
            dialtoneRef.current?.play().catch(() => { });

            // Send to signaling
            signalingAdapter.initiateCall(targetUserId, type);

        } catch (err: any) {
            console.error('[Call] Failed to initiate:', err);
            const message = err.name === 'NotAllowedError'
                ? 'Camera/microphone permission denied'
                : 'Failed to start call';
            toast.error(message);
            store.getState().setStatus('FAILED');
            cleanup();
        } finally {
            store.getState().setActionLock(false);
        }
    }, [store, createEngine, cleanup]);

    // ─────────────────────────────────────────────────────
    // ACCEPT CALL
    // ─────────────────────────────────────────────────────

    const acceptCall = useCallback(async () => {
        const state = store.getState();
        if (state.actionLock || !state.incomingCall) return;
        store.getState().setActionLock(true);

        const { incomingCall } = state;

        try {
            // Stop ringtone
            ringtoneRef.current?.pause();

            // Create engine & acquire media
            const engine = createEngine(incomingCall.callType);
            await engine.initialize();

            const stream = await engine.acquireMedia(incomingCall.callType);
            localStreamRef.current = stream;
            engine.addLocalTracks();

            // Update store
            store.getState().setCallData({
                callId: incomingCall.callId,
                callType: incomingCall.callType,
                direction: 'INCOMING',
                participant: {
                    id: incomingCall.callerId,
                    name: incomingCall.callerName,
                    avatar: incomingCall.callerAvatar,
                },
            });
            store.getState().setStatus('ACCEPTED');
            store.getState().setIncomingCall(null);

            // Send accept to signaling
            signalingAdapter.acceptCall(incomingCall.callId, incomingCall.callerId, incomingCall.callType);

            // Transition to CONNECTING
            store.getState().setStatus('CONNECTING');

        } catch (err: any) {
            console.error('[Call] Failed to accept:', err);
            toast.error('Media access denied');
            // Reject the call if we can't access media
            if (incomingCall) {
                signalingAdapter.rejectCall(incomingCall.callId, incomingCall.callerId, 'MEDIA_DENIED', incomingCall.callType);
            }
            cleanup();
        } finally {
            store.getState().setActionLock(false);
        }
    }, [store, createEngine, cleanup]);

    // ─────────────────────────────────────────────────────
    // REJECT CALL
    // ─────────────────────────────────────────────────────

    const rejectCall = useCallback(() => {
        const state = store.getState();
        const incoming = state.incomingCall;
        if (!incoming) return;

        ringtoneRef.current?.pause();
        signalingAdapter.rejectCall(incoming.callId, incoming.callerId, 'DECLINED', incoming.callType);
        cleanup();
    }, [store, cleanup]);

    // ─────────────────────────────────────────────────────
    // END CALL
    // ─────────────────────────────────────────────────────

    const endCall = useCallback(() => {
        const state = store.getState();
        if (state.callId) {
            const target = state.direction === 'OUTGOING' ? state.receiver : state.caller;
            if (target) {
                signalingAdapter.endCall(state.callId, target.id, state.callType);
            }
        }
        cleanup();
    }, [store, cleanup]);

    // ─────────────────────────────────────────────────────
    // TOGGLE MUTE / CAMERA
    // ─────────────────────────────────────────────────────

    const toggleMute = useCallback(() => {
        const state = store.getState();
        const newMuted = !state.isMuted;
        store.getState().toggleMute();
        engineRef.current?.toggleAudioTrack(!newMuted);
    }, [store]);

    const toggleCamera = useCallback(() => {
        const state = store.getState();
        const newCameraOff = !state.isCameraOff;
        store.getState().toggleCamera();
        engineRef.current?.toggleVideoTrack(!newCameraOff);

        // Notify peer
        if (state.callId) {
            signalingAdapter.sendVideoToggle(state.callId, !newCameraOff);
        }
    }, [store]);

    // ─────────────────────────────────────────────────────
    // VIDEO UPGRADE / DOWNGRADE
    // ─────────────────────────────────────────────────────

    const requestVideoUpgrade = useCallback(() => {
        const state = store.getState();
        if (state.status !== 'AUDIO_CONNECTED' || !state.callId) return;

        store.getState().setUpgradeState(true, 'self', 'SENT');
        signalingAdapter.sendUpgradeRequest(state.callId);
    }, [store]);

    const acceptVideoUpgrade = useCallback(async () => {
        const state = store.getState();
        if (state.status !== 'VIDEO_UPGRADING' || !state.callId) return;

        // Accept the upgrade
        signalingAdapter.sendUpgradeAccept(state.callId);

        // Actually add video track on our side
        if (engineRef.current) {
            const stream = await engineRef.current.addVideoTrack();
            if (stream) {
                localStreamRef.current = stream;
                window.dispatchEvent(new CustomEvent('call:local-stream-update'));
            }
        }
    }, [store]);

    const rejectVideoUpgrade = useCallback(() => {
        const state = store.getState();
        if (!state.callId) return;

        signalingAdapter.sendUpgradeReject(state.callId);
        store.getState().setUpgradeState(false, null, null);
        store.getState().setStatus('AUDIO_CONNECTED');
    }, [store]);

    const downgradeToAudio = useCallback(() => {
        const state = store.getState();
        if (!state.callId) return;

        engineRef.current?.removeVideoTrack();
        signalingAdapter.sendDowngradeAudio(state.callId);
        store.getState().setMediaMode('AUDIO_ONLY');
        store.getState().setStatus('AUDIO_CONNECTED');
    }, [store]);

    // ─────────────────────────────────────────────────────
    // SIGNALING EVENT LISTENERS
    // ─────────────────────────────────────────────────────

    useEffect(() => {
        // ── call:initiated (from server after successful initiation) ──
        const onInitiated = (data: any) => {
            const state = store.getState();
            if (state.status === 'INITIATING') {
                store.getState().setCallData({
                    callId: data.callId,
                    callType: data.callType || state.callType,
                    direction: 'OUTGOING',
                    participant: state.receiver!,
                });
                store.getState().setStatus('RINGING');
            }
        };

        // ── call:signal (all inbound signaling from server via Redis pub/sub) ──
        const onSignal = (data: any) => {
            if (!data || !data.type) return;

            switch (data.type) {
                case 'CALL_INCOMING': {
                    const state = store.getState();
                    if (state.status !== 'IDLE') {
                        // Already in a call — auto-reject
                        signalingAdapter.rejectCall(
                            data.callId,
                            data.payload?.callerId || data.senderId,
                            'BUSY',
                            data.payload?.callType || 'AUDIO'
                        );
                        return;
                    }
                    store.getState().setIncomingCall({
                        callId: data.callId,
                        callerId: data.payload?.callerId || data.senderId,
                        callerName: data.payload?.callerName || 'Unknown',
                        callerAvatar: data.payload?.callerAvatar,
                        callerUsername: data.payload?.callerUsername,
                        callType: data.payload?.callType || 'AUDIO',
                    });
                    store.getState().setStatus('INCOMING');
                    ringtoneRef.current?.play().catch(() => { });
                    break;
                }

                case 'CALL_ACCEPTED': {
                    handleCallAccepted(data);
                    break;
                }

                case 'CALL_REJECTED': {
                    toast.error(`Call declined: ${data.payload?.reason || 'Rejected'}`);
                    cleanup();
                    break;
                }

                case 'CALL_ENDED': {
                    toast.info(data.payload?.reason === 'HEARTBEAT_LOST' ? 'Connection lost' : 'Call ended');
                    cleanup();
                    break;
                }

                case 'CALL_TIMEOUT':
                case 'CALL_MISSED': {
                    toast.info('No answer');
                    cleanup();
                    break;
                }

                case 'CALL_HANDLED_ELSEWHERE': {
                    ringtoneRef.current?.pause();
                    cleanup();
                    break;
                }

                case 'WEBRTC_OFFER': {
                    handleWebRTCOffer(data);
                    break;
                }

                case 'WEBRTC_ANSWER': {
                    handleWebRTCAnswer(data);
                    break;
                }

                case 'ICE_CANDIDATE': {
                    handleIceCandidate(data);
                    break;
                }

                case 'ICE_RESTART': {
                    handleIceRestart(data);
                    break;
                }

                case 'CALL_QUALITY_DEGRADED': {
                    const s = store.getState();
                    const activeStates = ['AUDIO_CONNECTED', 'VIDEO_CONNECTED'];
                    if (activeStates.includes(s.status)) {
                        store.getState().setStatus('DEGRADED');
                        if (data.payload?.shouldFallbackToAudio && s.mediaMode === 'AUDIO_VIDEO') {
                            toast.warning('Low bandwidth — switching to audio only');
                        }
                    }
                    break;
                }

                case 'VIDEO_UPGRADE_REQUEST': {
                    store.getState().setUpgradeState(true, data.senderId, 'RECEIVED');
                    store.getState().setStatus('VIDEO_UPGRADING');
                    toast.info('Video call request received');
                    break;
                }

                case 'VIDEO_UPGRADE_ACCEPTED': {
                    handleUpgradeAccepted();
                    break;
                }

                case 'VIDEO_UPGRADE_REJECTED': {
                    store.getState().setUpgradeState(false, null, null);
                    store.getState().setStatus('AUDIO_CONNECTED');
                    toast.info(data.payload?.reason === 'UPGRADE_TIMEOUT' ? 'Video upgrade timed out' : 'Video upgrade declined');
                    break;
                }

                case 'VIDEO_UPGRADE_COMPLETE':
                case 'MEDIA_MODE_CHANGED': {
                    const mode = data.payload?.mediaMode;
                    if (mode === 'AUDIO_VIDEO') {
                        store.getState().setMediaMode('AUDIO_VIDEO');
                        store.getState().setStatus('VIDEO_CONNECTED');
                    } else if (mode === 'AUDIO_ONLY') {
                        store.getState().setMediaMode('AUDIO_ONLY');
                        store.getState().setStatus('AUDIO_CONNECTED');
                    }
                    // Handle camera toggle from peer
                    if (data.payload?.action === 'CAMERA_OFF' || data.payload?.action === 'CAMERA_ON') {
                        window.dispatchEvent(new CustomEvent('call:peer-video-toggle', {
                            detail: { enabled: data.payload.action === 'CAMERA_ON' },
                        }));
                    }
                    break;
                }

                case 'VIDEO_DOWNGRADE': {
                    store.getState().setMediaMode('AUDIO_ONLY');
                    store.getState().setStatus('AUDIO_CONNECTED');
                    if (data.payload?.reason === 'BANDWIDTH_CRITICAL') {
                        toast.warning('Switched to audio — low bandwidth');
                    } else {
                        toast.info('Switched to audio call');
                    }
                    break;
                }

                case 'SYSTEM_RECONNECT': {
                    toast.warning('Server maintenance — reconnecting...');
                    break;
                }
            }
        };

        // ── Direct Socket.IO events (not via call:signal wrapper) ──
        const onCallInitiated = (data: any) => onInitiated(data);
        const onCallRejected = (data: any) => {
            toast.error(`Call rejected: ${data?.reason || 'Rejected'}`);
            cleanup();
        };
        const onCallEnded = () => {
            toast.info('Call ended');
            cleanup();
        };
        const onCallAccepted = (data: any) => handleCallAccepted(data);
        const onUpgradeFailed = (data: any) => {
            store.getState().setUpgradeState(false, null, null);
            toast.error(data?.reason === 'UPGRADE_IN_PROGRESS' ? 'Upgrade already in progress' : 'Video upgrade failed');
        };
        const onError = (data: any) => {
            if (data?.code === 'RATE_LIMIT_EXCEEDED') {
                toast.error(data.message || 'Rate limit exceeded');
                cleanup();
            }
        };

        // WebRTC relay events (direct Socket.IO events for backward compat)
        const onOfferDirect = (data: any) => handleWebRTCOffer({ payload: { sdp: data.sdp }, callId: data.callId, senderId: data.senderId });
        const onAnswerDirect = (data: any) => handleWebRTCAnswer({ payload: { sdp: data.sdp } });
        const onIceDirect = (data: any) => handleIceCandidate({ payload: { candidate: data.candidate } });

        // Register all listeners
        socketService.on('call:signal', onSignal);
        socketService.on('call:initiated', onCallInitiated);
        socketService.on('call:rejected', onCallRejected);
        socketService.on('call:ended', onCallEnded);
        socketService.on('call:accepted', onCallAccepted);
        socketService.on('call:upgrade-failed', onUpgradeFailed);
        socketService.on('error', onError);

        // Direct WebRTC relays
        socketService.on('webrtc:offer', onOfferDirect);
        socketService.on('webrtc:answer', onAnswerDirect);
        socketService.on('webrtc:ice-candidate', onIceDirect);

        return () => {
            socketService.off('call:signal', onSignal);
            socketService.off('call:initiated', onCallInitiated);
            socketService.off('call:rejected', onCallRejected);
            socketService.off('call:ended', onCallEnded);
            socketService.off('call:accepted', onCallAccepted);
            socketService.off('call:upgrade-failed', onUpgradeFailed);
            socketService.off('error', onError);
            socketService.off('webrtc:offer', onOfferDirect);
            socketService.off('webrtc:answer', onAnswerDirect);
            socketService.off('webrtc:ice-candidate', onIceDirect);
        };
    }, [store, cleanup]);

    // ─────────────────────────────────────────────────────
    // WebRTC Signal Handlers
    // ─────────────────────────────────────────────────────

    async function handleCallAccepted(data: any) {
        const state = store.getState();
        dialtoneRef.current?.pause();

        if (!engineRef.current) return;

        // Update callId if provided
        if (data.callId && !state.callId) {
            store.getState().setCallData({
                callId: data.callId,
                callType: state.callType,
                direction: 'OUTGOING',
                participant: state.receiver!,
            });
        }

        // Transition to CONNECTING
        store.getState().setStatus('CONNECTING');

        // Create and send offer
        try {
            const offer = await engineRef.current.createOffer();
            const target = state.receiver;
            if (target && state.callId) {
                signalingAdapter.sendOffer(data.callId || state.callId, target.id, offer);
                store.getState().setStatus('ICE_NEGOTIATION');
            }
        } catch (err) {
            console.error('[Call] Failed to create offer:', err);
            store.getState().setStatus('FAILED');
            cleanup();
        }
    }

    async function handleWebRTCOffer(data: any) {
        if (!engineRef.current) return;

        const sdp = data.payload?.sdp || data.sdp;
        if (!sdp) return;

        try {
            await engineRef.current.setRemoteDescription(sdp);
            const answer = await engineRef.current.createAnswer();

            const state = store.getState();
            const target = state.direction === 'OUTGOING' ? state.receiver : state.caller;
            if (target && state.callId) {
                signalingAdapter.sendAnswer(state.callId, target.id, answer);
                store.getState().setStatus('ICE_NEGOTIATION');
            }
        } catch (err) {
            console.error('[Call] Failed to handle offer:', err);
        }
    }

    async function handleWebRTCAnswer(data: any) {
        if (!engineRef.current) return;

        const sdp = data.payload?.sdp || data.sdp;
        if (!sdp) return;

        try {
            await engineRef.current.setRemoteDescription(sdp);
        } catch (err) {
            console.error('[Call] Failed to handle answer:', err);
        }
    }

    async function handleIceCandidate(data: any) {
        if (!engineRef.current) return;

        const candidate = data.payload?.candidate || data.candidate;
        if (!candidate) return;

        try {
            await engineRef.current.addIceCandidate(candidate);
        } catch (err) {
            console.warn('[Call] Failed to add ICE candidate:', err);
        }
    }

    async function handleIceRestart(data: any) {
        if (!engineRef.current) return;

        store.getState().setStatus('RECONNECTING');
        try {
            const offer = await engineRef.current.restartIce();
            if (offer) {
                const state = store.getState();
                const target = state.direction === 'OUTGOING' ? state.receiver : state.caller;
                if (target && state.callId) {
                    signalingAdapter.sendOffer(state.callId, target.id, offer);
                }
            }
        } catch (err) {
            console.error('[Call] ICE restart failed:', err);
        }
    }

    async function handleUpgradeAccepted() {
        // The other party accepted — add video track and renegotiate
        if (!engineRef.current) return;

        try {
            const stream = await engineRef.current.addVideoTrack();
            if (stream) {
                localStreamRef.current = stream;
                window.dispatchEvent(new CustomEvent('call:local-stream-update'));

                // Create new offer with video
                const offer = await engineRef.current.createOffer();
                const state = store.getState();
                const target = state.direction === 'OUTGOING' ? state.receiver : state.caller;
                if (target && state.callId) {
                    signalingAdapter.sendOffer(state.callId, target.id, offer);
                    signalingAdapter.sendUpgradeComplete(state.callId);
                }

                store.getState().setMediaMode('AUDIO_VIDEO');
                store.getState().setStatus('VIDEO_CONNECTED');
                store.getState().setUpgradeState(false, null, null);
            }
        } catch (err) {
            console.error('[Call] Video upgrade failed:', err);
            toast.error('Camera access denied');
        }
    }

    // ─────────────────────────────────────────────────────
    // Browser Events (tab switch, page unload)
    // ─────────────────────────────────────────────────────

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            const state = store.getState();
            if (state.status !== 'IDLE' && state.status !== 'ENDED' && state.status !== 'FAILED') {
                e.preventDefault();
                endCall();
            }
        };

        const handleVisibilityChange = () => {
            // Pause/resume quality monitoring based on tab visibility
            // (saves CPU when tab is backgrounded)
        };

        const handleOnline = () => {
            const state = store.getState();
            if (state.status === 'RECONNECTING') {
                toast.info('Network restored — reconnecting...');
                attemptReconnect();
            }
        };

        const handleOffline = () => {
            const state = store.getState();
            const activeStates = ['AUDIO_CONNECTED', 'VIDEO_CONNECTED', 'DEGRADED'];
            if (activeStates.includes(state.status)) {
                store.getState().setStatus('RECONNECTING');
                toast.warning('Network disconnected');
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [store, endCall, attemptReconnect]);

    // ─────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────

    return (
        <CallContext.Provider value={{
            initiateCall,
            acceptCall,
            rejectCall,
            endCall,
            toggleMute,
            toggleCamera,
            requestVideoUpgrade,
            acceptVideoUpgrade,
            rejectVideoUpgrade,
            downgradeToAudio,
            localStreamRef,
            remoteStreamRef,
        }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context) throw new Error("useCall must be used within a CallProvider");
    return context;
};
