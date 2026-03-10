import { useEffect, useRef, useCallback } from 'react';
import { socketService } from '@/services/socket.service';
import { useAudioRoomStore, Participant } from '@/store/audio-room.store';
import { toast } from 'sonner';

interface UseRoomAudioProps {
    roomId: string;
    userId: string | undefined;
    myRole: 'HOST' | 'SPEAKER' | 'LISTENER';
    localStream: MediaStream | null;
}

export function useRoomAudio({ roomId, userId, myRole, localStream }: UseRoomAudioProps) {
    const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const iceServersRef = useRef<any[]>([]);
    
    const { speakers } = useAudioRoomStore();
    const speakersList = Array.from(speakers.values());

    // 1. Fetch TURN credentials
    useEffect(() => {
        if (!roomId) return;
        
        socketService.send('audio_room:get_turn_credentials', {}, (response: any) => {
            if (response.success && response.credentials) {
                iceServersRef.current = response.credentials.urls.map((url: string) => ({
                    urls: url,
                    username: response.credentials.username,
                    credential: response.credentials.credential
                }));
                console.log("[Audio] ICE Servers loaded:", iceServersRef.current.length);
            }
        });
    }, [roomId]);

    const cleanupPeer = useCallback((peerId: string) => {
        const pc = peersRef.current.get(peerId);
        if (pc) {
            pc.close();
            peersRef.current.delete(peerId);
            // Remove any audio elements associated
            const audio = document.getElementById(`audio-${peerId}`);
            if (audio) audio.remove();
        }
    }, []);

    const createPeerConnection = useCallback((targetUserId: string, isOffer: boolean) => {
        console.log(`[Audio] Creating PC for ${targetUserId}, isOffer=${isOffer}`);
        
        if (peersRef.current.has(targetUserId)) {
            cleanupPeer(targetUserId);
        }

        const pc = new RTCPeerConnection({
            iceServers: iceServersRef.current.length > 0 ? iceServersRef.current : [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        peersRef.current.set(targetUserId, pc);

        // 1. Handle ICE Candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socketService.send('audio_room:signal', {
                    roomId,
                    targetUserId,
                    signal: { type: 'ice-candidate', candidate: event.candidate }
                });
            }
        };

        // 2. Handle Incoming Tracks
        pc.ontrack = (event) => {
            console.log(`[Audio] Received track from ${targetUserId}`);
            let audio = document.getElementById(`audio-${targetUserId}`) as HTMLAudioElement;
            if (!audio) {
                audio = document.createElement('audio');
                audio.id = `audio-${targetUserId}`;
                audio.autoplay = true;
                // audio.style.display = 'none'; // Keep it hidden
                document.body.appendChild(audio);
            }
            audio.srcObject = event.streams[0];
        };

        // 3. Add Local Tracks if we are a speaker
        if (localStream && (myRole === 'HOST' || myRole === 'SPEAKER')) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
            });
        }

        // 4. Handle Negotiation Needed (Always set so either side can re-negotiate)
        pc.onnegotiationneeded = async () => {
            try {
                // Simple collision avoidance: Only initiate if we are the "offerer" (higher ID)
                // OR if the connection is already established (stable).
                if (userId && userId > targetUserId || pc.signalingState === 'stable') {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socketService.send('audio_room:signal', {
                        roomId,
                        targetUserId,
                        signal: { type: 'sdp-offer', sdp: offer }
                    });
                }
            } catch (err) {
                console.error("[Audio] Offer error:", err);
            }
        };

        return pc;
    }, [roomId, myRole, localStream, cleanupPeer]);

    // 2. Handle Signaling from Server
    useEffect(() => {
        const onSignal = async ({ senderId, signal }: { senderId: string, signal: any }) => {
            let pc = peersRef.current.get(senderId);

                if (signal.type === 'sdp-offer') {
                if (!pc) pc = createPeerConnection(senderId, false);
                
                // Handle glare: if we are also offering, and we have a higher ID, we ignore their offer
                if (pc.signalingState !== 'stable' && userId && userId > senderId) {
                    console.log("[Audio] Glare detected, ignoring offer from lower ID");
                    return;
                }

                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    socketService.send('audio_room:signal', {
                        roomId,
                        targetUserId: senderId,
                        signal: { type: 'sdp-answer', sdp: answer }
                    });
                } catch (err) {
                    console.error("[Audio] Handle offer error:", err);
                }
            } else if (signal.type === 'sdp-answer') {
                if (pc) {
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                    } catch (err) {
                        console.error("[Audio] Handle answer error:", err);
                    }
                }
            } else if (signal.type === 'ice-candidate') {
                if (pc) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                    } catch (err) {
                        console.error("[Audio] Add ICE error:", err);
                    }
                }
            }
        };

        socketService.on('audio_room:signal', onSignal);
        return () => socketService.off('audio_room:signal', onSignal);
    }, [roomId, createPeerConnection]);

    // 3. Monitor Speakers and initiate connections
    useEffect(() => {
        if (!userId) return;

        // Goal: Every pair (A, B) should have one connection if at least one is a speaker.
        // Tie-breaker: Higher ID offers to Lower ID.
        
        const allParticipants = [...speakersList, ...Array.from(useAudioRoomStore.getState().listeners.values())];
        
        allParticipants.forEach(participant => {
            if (participant.id === userId) return;
            
            const isTargetSpeaker = participant.role === 'HOST' || participant.role === 'SPEAKER';
            const amISpeaker = myRole === 'HOST' || myRole === 'SPEAKER';

            // Only connect if at least one is a speaker
            if (isTargetSpeaker || amISpeaker) {
                if (!peersRef.current.has(participant.id)) {
                    // Tie-breaker: Higher ID offers
                    if (userId > participant.id) {
                        createPeerConnection(participant.id, true);
                    }
                }
            }
        });

        // Cleanup stale peers (if someone is no longer in the room or no longer a speaker-relevant pair)
        const participantIds = new Set(allParticipants.map(p => p.id));
        peersRef.current.forEach((_, peerId) => {
            if (!participantIds.has(peerId)) {
                cleanupPeer(peerId);
            }
        });

    }, [speakersList, userId, myRole, createPeerConnection, cleanupPeer]);
    
    // 4. Synchronize local tracks with all existing peer connections when stream/role changes
    useEffect(() => {
        if (!localStream || (myRole !== 'HOST' && myRole !== 'SPEAKER')) return;

        console.log("[Audio] Syncing tracks to existing peers...");
        const tracks = localStream.getTracks();
        
        peersRef.current.forEach((pc) => {
            const senders = pc.getSenders();
            tracks.forEach(track => {
                const alreadySending = senders.some(s => s.track === track);
                if (!alreadySending) {
                    pc.addTrack(track, localStream);
                }
            });
        });
    }, [localStream, myRole]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            peersRef.current.forEach((_, peerId) => cleanupPeer(peerId));
        };
    }, [cleanupPeer]);
}
