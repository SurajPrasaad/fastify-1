/**
 * WebRTC Engine — RTCPeerConnection abstraction
 * 
 * Manages:
 * - Peer connection lifecycle
 * - SDP offer/answer negotiation
 * - ICE candidate management with trickle buffering
 * - TURN credential integration
 * - Audio-only optimized path
 * - Video track add/remove for mid-call upgrade
 * - ICE restart for reconnection
 * - Connection quality monitoring via getStats()
 * - Graceful stream cleanup
 */

import type { NetworkQuality } from '../store/call.store';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export interface TurnCredentials {
    urls: string[];
    username: string;
    credential: string;
    ttl: number;
}

export interface WebRTCEngineConfig {
    onRemoteStream: (stream: MediaStream) => void;
    onIceCandidate: (candidate: RTCIceCandidate) => void;
    onIceStateChange: (state: RTCIceConnectionState) => void;
    onConnectionStateChange: (state: RTCPeerConnectionState) => void;
    onNegotiationNeeded: () => void;
    onQualityUpdate: (quality: NetworkQuality, metrics: { rtt: number; jitter: number; packetLoss: number }) => void;
    onTrackEnded: (kind: 'audio' | 'video') => void;
}

type CallType = 'AUDIO' | 'VIDEO';

// ─────────────────────────────────────────────────────────────────
// Audio-only SDP optimization
// ─────────────────────────────────────────────────────────────────

function preferOpusCodec(sdp: string): string {
    // Prefer Opus codec for audio
    const lines = sdp.split('\r\n');
    const audioMLineIdx = lines.findIndex(l => l.startsWith('m=audio'));
    if (audioMLineIdx === -1) return sdp;

    // Find Opus payload type
    const opusLine = lines.find(l => l.includes('opus/48000'));
    if (!opusLine) return sdp;

    const match = opusLine.match(/^a=rtpmap:(\d+)\s+opus/);
    if (!match) return sdp;

    const opusPT = match[1];
    const mLine = lines[audioMLineIdx]!;
    const parts = mLine.split(' ');
    // Remove Opus PT from current position and prepend after the first 3 fields
    const pts = parts.slice(3).filter(pt => pt !== opusPT);
    pts.unshift(opusPT!);
    lines[audioMLineIdx] = [...parts.slice(0, 3), ...pts].join(' ');

    return lines.join('\r\n');
}

// ─────────────────────────────────────────────────────────────────
// WebRTC Engine Class
// ─────────────────────────────────────────────────────────────────

export class WebRTCEngine {
    private pc: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;
    private remoteStream: MediaStream | null = null;
    private config: WebRTCEngineConfig;
    private callType: CallType;
    private statsInterval: ReturnType<typeof setInterval> | null = null;
    private iceCandidateBuffer: RTCIceCandidate[] = [];
    private remoteDescriptionSet = false;
    private audioSender: RTCRtpSender | null = null;
    private videoSender: RTCRtpSender | null = null;

    constructor(config: WebRTCEngineConfig, callType: CallType) {
        this.config = config;
        this.callType = callType;
    }

    // ─────────────────────────────────────────────────────
    // Initialization
    // ─────────────────────────────────────────────────────

    /**
     * Create RTCPeerConnection with TURN credentials
     */
    async initialize(turnCredentials?: TurnCredentials): Promise<void> {
        const iceServers: RTCIceServer[] = [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ];

        if (turnCredentials) {
            iceServers.push({
                urls: turnCredentials.urls,
                username: turnCredentials.username,
                credential: turnCredentials.credential,
            });
        }

        this.pc = new RTCPeerConnection({
            iceServers,
            iceCandidatePoolSize: this.callType === 'AUDIO' ? 2 : 4,
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require',
        });

        this.setupPeerConnectionHandlers();
        this.startQualityMonitoring();
    }

    /**
     * Setup all PCevent handlers
     */
    private setupPeerConnectionHandlers(): void {
        if (!this.pc) return;

        this.pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.config.onIceCandidate(event.candidate);
            }
        };

        this.pc.ontrack = (event) => {
            if (!this.remoteStream) {
                this.remoteStream = new MediaStream();
            }
            event.streams[0]?.getTracks().forEach(track => {
                this.remoteStream!.addTrack(track);
            });
            this.config.onRemoteStream(this.remoteStream);
        };

        this.pc.oniceconnectionstatechange = () => {
            if (this.pc) {
                this.config.onIceStateChange(this.pc.iceConnectionState);
            }
        };

        this.pc.onconnectionstatechange = () => {
            if (this.pc) {
                this.config.onConnectionStateChange(this.pc.connectionState);
            }
        };

        this.pc.onnegotiationneeded = () => {
            this.config.onNegotiationNeeded();
        };
    }

    // ─────────────────────────────────────────────────────
    // Media Acquisition
    // ─────────────────────────────────────────────────────

    /**
     * Acquire local media stream
     */
    async acquireMedia(type: CallType): Promise<MediaStream> {
        const constraints: MediaStreamConstraints = {
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 48000,
            },
            video: type === 'VIDEO' ? {
                width: { ideal: 1280, max: 1920 },
                height: { ideal: 720, max: 1080 },
                frameRate: { ideal: 30, max: 30 },
                facingMode: 'user',
            } : false,
        };

        this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

        // Listen for track ended events (device removed)
        this.localStream.getTracks().forEach(track => {
            track.onended = () => {
                this.config.onTrackEnded(track.kind as 'audio' | 'video');
            };
        });

        return this.localStream;
    }

    /**
     * Add local tracks to peer connection
     */
    addLocalTracks(): void {
        if (!this.pc || !this.localStream) return;

        this.localStream.getTracks().forEach(track => {
            const sender = this.pc!.addTrack(track, this.localStream!);
            if (track.kind === 'audio') this.audioSender = sender;
            if (track.kind === 'video') this.videoSender = sender;
        });
    }

    // ─────────────────────────────────────────────────────
    // SDP Negotiation
    // ─────────────────────────────────────────────────────

    /**
     * Create and return an SDP offer
     */
    async createOffer(): Promise<RTCSessionDescription> {
        if (!this.pc) throw new Error('PeerConnection not initialized');

        const offerOptions: RTCOfferOptions = {
            offerToReceiveAudio: true,
            offerToReceiveVideo: this.callType === 'VIDEO',
        };

        const offer = await this.pc.createOffer(offerOptions);

        // Optimize SDP — prefer Opus for audio
        if (offer.sdp) {
            offer.sdp = preferOpusCodec(offer.sdp);
        }

        await this.pc.setLocalDescription(offer);
        return this.pc.localDescription!;
    }

    /**
     * Create and return an SDP answer
     */
    async createAnswer(): Promise<RTCSessionDescription> {
        if (!this.pc) throw new Error('PeerConnection not initialized');

        const answer = await this.pc.createAnswer();

        if (answer.sdp) {
            answer.sdp = preferOpusCodec(answer.sdp);
        }

        await this.pc.setLocalDescription(answer);
        return this.pc.localDescription!;
    }

    /**
     * Set remote SDP description
     */
    async setRemoteDescription(sdp: RTCSessionDescriptionInit): Promise<void> {
        if (!this.pc) throw new Error('PeerConnection not initialized');

        await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
        this.remoteDescriptionSet = true;

        // Flush buffered ICE candidates
        for (const candidate of this.iceCandidateBuffer) {
            await this.pc.addIceCandidate(candidate);
        }
        this.iceCandidateBuffer = [];
    }

    // ─────────────────────────────────────────────────────
    // ICE Candidate Management
    // ─────────────────────────────────────────────────────

    /**
     * Add a remote ICE candidate (buffers if remote description not yet set)
     */
    async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
        const iceCandidate = new RTCIceCandidate(candidate);

        if (!this.remoteDescriptionSet) {
            this.iceCandidateBuffer.push(iceCandidate);
            return;
        }

        if (this.pc) {
            try {
                await this.pc.addIceCandidate(iceCandidate);
            } catch (err) {
                console.warn('[WebRTC] Failed to add ICE candidate:', err);
            }
        }
    }

    /**
     * Trigger ICE restart for reconnection
     */
    async restartIce(): Promise<RTCSessionDescription | null> {
        if (!this.pc) return null;

        const offer = await this.pc.createOffer({ iceRestart: true });
        if (offer.sdp) {
            offer.sdp = preferOpusCodec(offer.sdp);
        }
        await this.pc.setLocalDescription(offer);
        return this.pc.localDescription;
    }

    // ─────────────────────────────────────────────────────
    // Video Upgrade / Downgrade
    // ─────────────────────────────────────────────────────

    /**
     * Upgrade: Add video track to an audio-only call
     * Returns the new local stream for UI display
     */
    async addVideoTrack(): Promise<MediaStream | null> {
        if (!this.pc || !this.localStream) return null;

        try {
            const videoStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 },
                    frameRate: { ideal: 30, max: 30 },
                    facingMode: 'user',
                },
            });

            const videoTrack = videoStream.getVideoTracks()[0];
            if (!videoTrack) return null;

            // Add to local stream
            this.localStream.addTrack(videoTrack);

            // Add to peer connection
            this.videoSender = this.pc.addTrack(videoTrack, this.localStream);

            // Listen for device removal
            videoTrack.onended = () => {
                this.config.onTrackEnded('video');
            };

            this.callType = 'VIDEO';
            return this.localStream;
        } catch (err) {
            console.error('[WebRTC] Failed to add video track:', err);
            return null;
        }
    }

    /**
     * Downgrade: Remove video track (switch to audio-only)
     */
    async removeVideoTrack(): Promise<void> {
        if (!this.pc || !this.localStream) return;

        // Remove video track from local stream
        const videoTracks = this.localStream.getVideoTracks();
        videoTracks.forEach(track => {
            track.stop();
            this.localStream!.removeTrack(track);
        });

        // Remove from peer connection
        if (this.videoSender) {
            this.pc.removeTrack(this.videoSender);
            this.videoSender = null;
        }

        this.callType = 'AUDIO';
    }

    /**
     * Enable/disable video without renegotiation
     */
    toggleVideoTrack(enabled: boolean): void {
        if (this.localStream) {
            this.localStream.getVideoTracks().forEach(track => {
                track.enabled = enabled;
            });
        }
    }

    /**
     * Enable/disable audio
     */
    toggleAudioTrack(enabled: boolean): void {
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = enabled;
            });
        }
    }

    // ─────────────────────────────────────────────────────
    // Quality Monitoring
    // ─────────────────────────────────────────────────────

    private startQualityMonitoring(): void {
        this.statsInterval = setInterval(async () => {
            if (!this.pc) return;

            try {
                const stats = await this.pc.getStats();
                let totalRtt = 0;
                let totalJitter = 0;
                let totalPacketLoss = 0;
                let count = 0;

                stats.forEach(report => {
                    if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                        totalRtt += report.currentRoundTripTime || 0;
                        count++;
                    }
                    if (report.type === 'inbound-rtp') {
                        totalJitter += report.jitter || 0;
                        totalPacketLoss += report.packetsLost || 0;
                    }
                });

                const rtt = count > 0 ? Math.round((totalRtt / count) * 1000) : 0;
                const jitter = Math.round(totalJitter * 1000);
                const packetLoss = totalPacketLoss;

                // Classify quality
                let quality: NetworkQuality = 'EXCELLENT';
                if (rtt > 300 || jitter > 100 || packetLoss > 10) quality = 'CRITICAL';
                else if (rtt > 200 || jitter > 50 || packetLoss > 5) quality = 'POOR';
                else if (rtt > 150 || jitter > 30 || packetLoss > 2) quality = 'FAIR';
                else if (rtt > 80 || jitter > 15) quality = 'GOOD';

                this.config.onQualityUpdate(quality, { rtt, jitter, packetLoss });
            } catch {
                // Stats collection is best-effort
            }
        }, 3000); // Every 3 seconds
    }

    // ─────────────────────────────────────────────────────
    // Getters
    // ─────────────────────────────────────────────────────

    getLocalStream(): MediaStream | null {
        return this.localStream;
    }

    getRemoteStream(): MediaStream | null {
        return this.remoteStream;
    }

    getPeerConnection(): RTCPeerConnection | null {
        return this.pc;
    }

    getConnectionState(): RTCPeerConnectionState | null {
        return this.pc?.connectionState || null;
    }

    getIceConnectionState(): RTCIceConnectionState | null {
        return this.pc?.iceConnectionState || null;
    }

    // ─────────────────────────────────────────────────────
    // Cleanup
    // ─────────────────────────────────────────────────────

    /**
     * Gracefully tear down all resources
     */
    destroy(): void {
        // Stop quality monitoring
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = null;
        }

        // Stop local media tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                track.onended = null;
                track.stop();
            });
            this.localStream = null;
        }

        // Close peer connection
        if (this.pc) {
            this.pc.onicecandidate = null;
            this.pc.ontrack = null;
            this.pc.oniceconnectionstatechange = null;
            this.pc.onconnectionstatechange = null;
            this.pc.onnegotiationneeded = null;
            this.pc.close();
            this.pc = null;
        }

        // Clear remote stream
        this.remoteStream = null;
        this.audioSender = null;
        this.videoSender = null;
        this.iceCandidateBuffer = [];
        this.remoteDescriptionSet = false;
    }
}
