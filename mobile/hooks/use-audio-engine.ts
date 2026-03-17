import { useEffect, useRef, useCallback, useState } from 'react';
import { 
    RTCPeerConnection, 
    RTCIceCandidate, 
    RTCSessionDescription, 
    MediaStream,
    mediaDevices
} from 'react-native-webrtc';
import { useAudioRoomStore } from '../store/audio-room-store';
import { useAuthStore } from '../store/auth-store';

interface UseAudioEngineProps {
    roomId: string | null;
    socket: any;
}

export function useAudioEngine({ roomId, socket }: UseAudioEngineProps) {
    const peersRef = useRef<Map<string, any>>(new Map());
    const iceServersRef = useRef<any[]>([]);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    
    const { user } = useAuthStore();
    const { speakers, myRole, listeners } = useAudioRoomStore();
    const speakersList = Array.from(speakers.values());
    const userId = user?.id;

    // 1. Initialize Local Stream if Speaker/Host
    useEffect(() => {
        let isMounted = true;
        
        const initStream = async () => {
            if (myRole === 'HOST' || myRole === 'SPEAKER') {
                try {
                    const stream = await mediaDevices.getUserMedia({
                        audio: true,
                        video: false
                    });
                    if (isMounted) setLocalStream(stream as MediaStream);
                } catch (err) {
                    console.error("[AudioEngine] Media Error:", err);
                }
            } else {
                if (localStream) {
                    localStream.getTracks().forEach(t => t.stop());
                    setLocalStream(null);
                }
            }
        };

        initStream();
        return () => { isMounted = false; };
    }, [myRole]);

    // 2. Load TURN credentials
    useEffect(() => {
        if (!roomId || !socket) return;
        
        socket.send('audio_room:get_turn_credentials', {}, (response: any) => {
            if (response.success && response.credentials) {
                iceServersRef.current = response.credentials.urls.map((url: string) => ({
                    urls: url,
                    username: response.credentials.username,
                    credential: response.credentials.credential
                }));
            }
        });
    }, [roomId, socket]);

    const cleanupPeer = useCallback((peerId: string) => {
        const pc = peersRef.current.get(peerId);
        if (pc) {
            pc.close();
            peersRef.current.delete(peerId);
        }
    }, []);

    const createPeerConnection = useCallback((targetUserId: string) => {
        if (peersRef.current.has(targetUserId)) {
            cleanupPeer(targetUserId);
        }

        const pc = new RTCPeerConnection({
            iceServers: iceServersRef.current.length > 0 ? iceServersRef.current : [{ urls: 'stun:stun.l.google.com:19302' }]
        }) as any;

        peersRef.current.set(targetUserId, pc);

        pc.onicecandidate = (event: any) => {
            if (event.candidate) {
                socket.send('audio_room:signal', {
                    roomId,
                    targetUserId,
                    signal: { type: 'ice-candidate', candidate: event.candidate }
                });
            }
        };

        pc.ontrack = (event: any) => {
            console.log(`[AudioEngine] Received track from ${targetUserId}`);
            // In mobile, audio tracks from peer connections automatically play 
            // once added to the connection and as long as the audio session is active.
        };

        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
            });
        }

        pc.onnegotiationneeded = async () => {
            try {
                if (userId && userId > targetUserId || pc.signalingState === 'stable') {
                    const offer = await pc.createOffer({});
                    await pc.setLocalDescription(offer);
                    socket.send('audio_room:signal', {
                        roomId,
                        targetUserId,
                        signal: { type: 'sdp-offer', sdp: offer }
                    });
                }
            } catch (err) {
                console.error("[AudioEngine] Offer error:", err);
            }
        };

        return pc as any;
    }, [roomId, socket, localStream, userId, cleanupPeer]);

    // 3. Handle Signaling
    useEffect(() => {
        if (!socket) return;

        const onSignal = async ({ senderId, signal }: { senderId: string, signal: any }) => {
            let pc = peersRef.current.get(senderId);

            if (signal.type === 'sdp-offer') {
                if (!pc) pc = createPeerConnection(senderId);
                
                if (pc.signalingState !== 'stable' && userId && userId > senderId) {
                    return;
                }

                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    socket.send('audio_room:signal', {
                        roomId,
                        targetUserId: senderId,
                        signal: { type: 'sdp-answer', sdp: answer }
                    });
                } catch (err) {
                    console.error("[AudioEngine] Handle offer error:", err);
                }
            } else if (signal.type === 'sdp-answer') {
                if (pc) {
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                    } catch (err) {
                        console.error("[AudioEngine] Handle answer error:", err);
                    }
                }
            } else if (signal.type === 'ice-candidate') {
                if (pc) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                    } catch (err) {
                        console.error("[AudioEngine] Add ICE error:", err);
                    }
                }
            }
        };

        socket.on('audio_room:signal', onSignal);
        return () => socket.off('audio_room:signal', onSignal);
    }, [roomId, socket, createPeerConnection, userId]);

    // 4. Mesh Connection Logic
    useEffect(() => {
        if (!userId) return;

        const allParticipants = [...speakersList, ...Array.from(listeners.values())];
        
        allParticipants.forEach(participant => {
            if (participant.id === userId) return;
            
            const isTargetSpeaker = participant.role === 'HOST' || participant.role === 'SPEAKER';
            const amISpeaker = myRole === 'HOST' || myRole === 'SPEAKER';

            if (isTargetSpeaker || amISpeaker) {
                if (!peersRef.current.has(participant.id)) {
                    if (userId > participant.id) {
                        createPeerConnection(participant.id);
                    }
                }
            }
        });

        // Cleanup stale peers
        const participantIds = new Set(allParticipants.map(p => p.id));
        peersRef.current.forEach((_, peerId) => {
            if (!participantIds.has(peerId)) {
                cleanupPeer(peerId);
            }
        });

    }, [speakersList, listeners, userId, myRole, createPeerConnection, cleanupPeer]);

    // 5. Mute/Unmute track
    useEffect(() => {
        if (localStream) {
            const isMuted = useAudioRoomStore.getState().isMuted;
            localStream.getAudioTracks().forEach(t => {
                t.enabled = !isMuted;
            });
        }
    }, [localStream]);

    return { localStream };
}
