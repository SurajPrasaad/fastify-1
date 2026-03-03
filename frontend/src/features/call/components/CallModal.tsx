"use client";

/**
 * CallModal — Production call UI
 *
 * Features:
 * - Incoming call overlay with accept/reject
 * - Outgoing call (ringing) screen
 * - Active audio call UI (avatar, timer, controls)
 * - Active video call UI (remote fullscreen, local PiP, draggable)
 * - Video upgrade request modal
 * - Network quality indicator
 * - Call duration timer
 * - Controls: mute, camera, speaker, upgrade to video, fullscreen, end
 * - Reconnecting / degraded / failed state display
 * - Smooth animations
 */

import React, { useEffect, useRef, useState, useCallback, memo } from "react";
import { useCall } from "../context/CallContext";
import { useCallStore } from "../store/call.store";
import {
    Phone, PhoneOff, Video, VideoOff, Mic, MicOff,
    Maximize2, Minimize2, Volume2, VolumeX,
    SignalHigh, SignalMedium, SignalLow, SignalZero,
    ArrowUpCircle, Loader2, WifiOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────
// Memoized Video Component (prevents re-render during streams)
// ─────────────────────────────────────────────────────

const VideoElement = memo(({ streamRef, muted, mirrored, className }: {
    streamRef: React.MutableRefObject<MediaStream | null>;
    muted: boolean;
    mirrored?: boolean;
    className?: string;
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const updateStream = () => {
            if (videoRef.current && streamRef.current) {
                videoRef.current.srcObject = streamRef.current;
            }
        };

        updateStream();

        // Listen for stream updates
        const handler = () => updateStream();
        window.addEventListener('call:remote-stream-update', handler);
        window.addEventListener('call:local-stream-update', handler);
        return () => {
            window.removeEventListener('call:remote-stream-update', handler);
            window.removeEventListener('call:local-stream-update', handler);
        };
    }, [streamRef]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
            className={cn(className, mirrored && "scale-x-[-1]")}
        />
    );
});
VideoElement.displayName = "VideoElement";

// ─────────────────────────────────────────────────────
// Network Quality Indicator
// ─────────────────────────────────────────────────────

const NetworkIndicator = memo(() => {
    const quality = useCallStore(s => s.networkQuality);
    const rtt = useCallStore(s => s.rtt);

    const config = {
        EXCELLENT: { icon: SignalHigh, color: 'text-green-400', label: 'Excellent' },
        GOOD: { icon: SignalHigh, color: 'text-green-400', label: 'Good' },
        FAIR: { icon: SignalMedium, color: 'text-yellow-400', label: 'Fair' },
        POOR: { icon: SignalLow, color: 'text-orange-400', label: 'Poor' },
        CRITICAL: { icon: SignalZero, color: 'text-red-400', label: 'Critical' },
        UNKNOWN: { icon: SignalMedium, color: 'text-zinc-400', label: '' },
    };

    const { icon: Icon, color, label } = config[quality];

    return (
        <div className={cn("flex items-center gap-1 text-xs", color)}>
            <Icon className="w-4 h-4" />
            {label && <span>{label}</span>}
            {rtt > 0 && <span className="opacity-60">{rtt}ms</span>}
        </div>
    );
});
NetworkIndicator.displayName = "NetworkIndicator";

// ─────────────────────────────────────────────────────
// Call Timer
// ─────────────────────────────────────────────────────

const CallTimer = memo(() => {
    const duration = useCallStore(s => s.callDuration);
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    return (
        <span className="text-sm font-mono text-zinc-300 tabular-nums">
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </span>
    );
});
CallTimer.displayName = "CallTimer";

// ─────────────────────────────────────────────────────
// Control Button
// ─────────────────────────────────────────────────────

const ControlButton = ({ onClick, active, danger, children, label, disabled }: {
    onClick: () => void;
    active?: boolean;
    danger?: boolean;
    children: React.ReactNode;
    label?: string;
    disabled?: boolean;
}) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
            "flex flex-col items-center gap-1 transition-all duration-200",
            disabled && "opacity-40 cursor-not-allowed"
        )}
    >
        <div className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200",
            danger
                ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30"
                : active
                    ? "bg-white/20 ring-2 ring-white/40"
                    : "bg-white/10 hover:bg-white/20 backdrop-blur-sm",
        )}>
            {children}
        </div>
        {label && <span className="text-[10px] text-zinc-400">{label}</span>}
    </button>
);

// ─────────────────────────────────────────────────────
// Main CallModal Component
// ─────────────────────────────────────────────────────

export const CallModal = () => {
    const {
        acceptCall, rejectCall, endCall,
        toggleMute, toggleCamera,
        requestVideoUpgrade, acceptVideoUpgrade, rejectVideoUpgrade,
        downgradeToAudio,
        localStreamRef, remoteStreamRef,
    } = useCall();

    const status = useCallStore(s => s.status);
    const callType = useCallStore(s => s.callType);
    const mediaMode = useCallStore(s => s.mediaMode);
    const direction = useCallStore(s => s.direction);
    const caller = useCallStore(s => s.caller);
    const receiver = useCallStore(s => s.receiver);
    const incomingCall = useCallStore(s => s.incomingCall);
    const isMuted = useCallStore(s => s.isMuted);
    const isCameraOff = useCallStore(s => s.isCameraOff);
    const upgradeRequested = useCallStore(s => s.upgradeRequested);
    const upgradeDirection = useCallStore(s => s.upgradeDirection);
    const isFullscreen = useCallStore(s => s.isFullscreen);
    const errorMessage = useCallStore(s => s.errorMessage);

    const [peerCameraOff, setPeerCameraOff] = useState(false);

    // Listen for peer video toggle
    useEffect(() => {
        const handler = (e: CustomEvent) => {
            setPeerCameraOff(!e.detail.enabled);
        };
        window.addEventListener('call:peer-video-toggle', handler as EventListener);
        return () => window.removeEventListener('call:peer-video-toggle', handler as EventListener);
    }, []);

    // Don't render when idle
    if (status === 'IDLE') return null;

    const participant = direction === 'OUTGOING' ? receiver : caller;
    const participantName = participant?.name || incomingCall?.callerName || 'Unknown';
    const participantAvatar = participant?.avatar || incomingCall?.callerAvatar;
    const participantInitial = participantName[0]?.toUpperCase() || '?';

    const isVideoMode = mediaMode === 'AUDIO_VIDEO';
    const isConnected = ['AUDIO_CONNECTED', 'VIDEO_CONNECTED', 'DEGRADED'].includes(status);
    const isRinging = status === 'INCOMING';
    const isOutgoing = ['INITIATING', 'RINGING'].includes(status);
    const isConnecting = ['ACCEPTED', 'CONNECTING', 'ICE_NEGOTIATION'].includes(status);
    const isReconnecting = status === 'RECONNECTING';
    const isFailed = status === 'FAILED';
    const isUpgrading = status === 'VIDEO_UPGRADING';

    // ── Status text ──
    let statusText = '';
    if (isRinging) statusText = 'Incoming call...';
    else if (isOutgoing) statusText = 'Ringing...';
    else if (isConnecting) statusText = 'Connecting...';
    else if (isReconnecting) statusText = 'Reconnecting...';
    else if (isFailed) statusText = errorMessage || 'Call failed';
    else if (isUpgrading) statusText = 'Video upgrade...';
    else if (status === 'DEGRADED') statusText = 'Poor connection';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                    "fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4",
                    isFullscreen && "p-0"
                )}
            >
                <div className={cn(
                    "relative w-full bg-zinc-900 overflow-hidden shadow-2xl border border-white/5 flex flex-col",
                    isFullscreen
                        ? "h-full max-w-none rounded-none"
                        : "max-w-5xl aspect-video rounded-3xl",
                )}>

                    {/* ── Background / Remote Stream ── */}
                    <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 to-zinc-900 flex items-center justify-center">
                        {isConnected && isVideoMode && !peerCameraOff ? (
                            <VideoElement
                                streamRef={remoteStreamRef}
                                muted={false}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-6 select-none">
                                {/* Avatar */}
                                <motion.div
                                    animate={isRinging || isOutgoing ? { scale: [1, 1.05, 1] } : {}}
                                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                                    className="relative"
                                >
                                    <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-4 ring-white/10 shadow-2xl shadow-blue-500/20 overflow-hidden">
                                        {participantAvatar ? (
                                            <img src={participantAvatar} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-5xl md:text-6xl font-bold text-white">{participantInitial}</span>
                                        )}
                                    </div>
                                    {(isRinging || isOutgoing) && (
                                        <motion.div
                                            animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                                            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut' }}
                                            className="absolute inset-0 rounded-full border-2 border-blue-400"
                                        />
                                    )}
                                </motion.div>

                                {/* Name */}
                                <h2 className="text-2xl md:text-3xl font-bold text-white">{participantName}</h2>

                                {/* Status */}
                                {statusText && (
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        {(isConnecting || isReconnecting || isOutgoing) && (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        )}
                                        {isReconnecting && <WifiOff className="w-4 h-4 text-yellow-400" />}
                                        <span className="animate-pulse">{statusText}</span>
                                    </div>
                                )}

                                {/* Timer (shown during connected audio calls) */}
                                {isConnected && !isVideoMode && <CallTimer />}
                            </div>
                        )}
                    </div>

                    {/* ── Top bar (timer + network quality) ── */}
                    {isConnected && (
                        <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                {isVideoMode && <CallTimer />}
                                <span className="text-xs text-zinc-400 hidden md:block">
                                    {isVideoMode ? 'Video Call' : 'Audio Call'}
                                </span>
                            </div>
                            <NetworkIndicator />
                        </div>
                    )}

                    {/* ── Local Video PiP (draggable) ── */}
                    {isConnected && isVideoMode && (
                        <motion.div
                            drag
                            dragConstraints={{ left: -400, right: 0, top: 0, bottom: 200 }}
                            className="absolute top-20 right-4 w-36 md:w-48 aspect-video bg-black rounded-2xl overflow-hidden shadow-xl border border-white/10 z-20 cursor-move"
                        >
                            {!isCameraOff ? (
                                <VideoElement
                                    streamRef={localStreamRef}
                                    muted={true}
                                    mirrored
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                    <VideoOff className="w-6 h-6 text-zinc-600" />
                                </div>
                            )}
                            {isMuted && (
                                <div className="absolute bottom-2 left-2 bg-red-500/80 rounded-full p-1">
                                    <MicOff className="w-3 h-3 text-white" />
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── Video Upgrade Request Modal ── */}
                    {isUpgrading && upgradeDirection === 'RECEIVED' && (
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-zinc-800/95 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl text-center max-w-sm w-full mx-4"
                        >
                            <Video className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-white mb-1">Video Call Request</h3>
                            <p className="text-sm text-zinc-400 mb-5">
                                {participantName} wants to switch to video
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={rejectVideoUpgrade}
                                    className="px-6 py-2.5 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium transition-colors"
                                >
                                    Decline
                                </button>
                                <button
                                    onClick={acceptVideoUpgrade}
                                    className="px-6 py-2.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors shadow-lg shadow-blue-500/30"
                                >
                                    Accept
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Controls Overlay ── */}
                    <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center gap-5 z-10">

                        {/* Incoming call buttons */}
                        {isRinging && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="flex items-center gap-8"
                            >
                                <ControlButton onClick={rejectCall} danger label="Decline">
                                    <PhoneOff className="w-7 h-7 text-white" />
                                </ControlButton>
                                <ControlButton onClick={acceptCall} label="Accept">
                                    <div className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg shadow-green-500/30 transition-colors">
                                        <Phone className="w-7 h-7 text-white" />
                                    </div>
                                </ControlButton>
                            </motion.div>
                        )}

                        {/* Active call controls */}
                        {(isConnected || isConnecting || isUpgrading || isReconnecting) && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="flex items-center gap-3 md:gap-4 bg-white/5 backdrop-blur-2xl p-3 md:p-4 rounded-3xl border border-white/10"
                            >
                                {/* Mute */}
                                <ControlButton onClick={toggleMute} active={isMuted} label="Mute">
                                    {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
                                </ControlButton>

                                {/* Camera (only show in video mode) */}
                                {isVideoMode && (
                                    <ControlButton onClick={toggleCamera} active={isCameraOff} label="Camera">
                                        {isCameraOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
                                    </ControlButton>
                                )}

                                {/* Upgrade to video (only in audio mode) */}
                                {!isVideoMode && isConnected && status === 'AUDIO_CONNECTED' && (
                                    <ControlButton
                                        onClick={requestVideoUpgrade}
                                        disabled={upgradeRequested}
                                        label="Video"
                                    >
                                        <ArrowUpCircle className="w-5 h-5 text-blue-400" />
                                    </ControlButton>
                                )}

                                {/* Downgrade to audio (in video mode) */}
                                {isVideoMode && isConnected && (
                                    <ControlButton onClick={downgradeToAudio} label="Audio">
                                        <Phone className="w-5 h-5 text-white" />
                                    </ControlButton>
                                )}

                                {/* Fullscreen */}
                                {isVideoMode && (
                                    <ControlButton
                                        onClick={() => useCallStore.getState().toggleFullscreen()}
                                        label="Expand"
                                    >
                                        {isFullscreen
                                            ? <Minimize2 className="w-5 h-5 text-white" />
                                            : <Maximize2 className="w-5 h-5 text-white" />}
                                    </ControlButton>
                                )}

                                {/* End Call */}
                                <ControlButton onClick={endCall} danger label="End">
                                    <PhoneOff className="w-6 h-6 text-white" />
                                </ControlButton>
                            </motion.div>
                        )}

                        {/* Outgoing (ringing) cancel button */}
                        {isOutgoing && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                            >
                                <ControlButton onClick={endCall} danger label="Cancel">
                                    <PhoneOff className="w-7 h-7 text-white" />
                                </ControlButton>
                            </motion.div>
                        )}

                        {/* Failed state — close button */}
                        {isFailed && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                            >
                                <ControlButton onClick={() => useCallStore.getState().reset()} danger label="Close">
                                    <PhoneOff className="w-7 h-7 text-white" />
                                </ControlButton>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
