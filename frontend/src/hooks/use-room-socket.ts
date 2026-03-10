import { useEffect } from 'react';
import { socketService } from '@/services/socket.service';
import { useAudioRoomStore, Participant } from '@/store/audio-room.store';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export function useRoomSocket(roomId: string | undefined, userId: string | undefined) {
    const {
        addParticipant,
        removeParticipant,
        updateParticipantRole,
        addRaisedHand,
        removeRaisedHand,
        setMyRole,
        setSpeakingStatus,
        clearRoom
    } = useAudioRoomStore();

    useEffect(() => {
        if (!roomId) return;

        // 1. Connect and join the room channel
        socketService.connect();

        // Use a callback for join to handle historical participants
        socketService.send('audio_room:join', { roomId }, (response: any) => {
            if (response.success && response.participants) {
                response.participants.forEach((p: any) => {
                    // Check if we already have full user details or just basic meta
                    addParticipant({
                        id: p.userId,
                        name: p.name || 'User',
                        username: p.username || 'user',
                        avatarUrl: p.avatarUrl || null,
                        role: p.role || 'LISTENER',
                    });
                });
                if (response.role) setMyRole(response.role);
            }
        });

        // 2. Setup listeners
        const onParticipantJoined = (data: { userId: string; user?: any; role: 'HOST' | 'SPEAKER' | 'LISTENER' }) => {
            if (data.user) {
                addParticipant({
                    id: data.user.id,
                    name: data.user.name,
                    username: data.user.username,
                    avatarUrl: data.user.avatarUrl || null,
                    role: data.role || 'LISTENER',
                });
            } else {
                // Fallback for minimal join
                addParticipant({
                    id: data.userId,
                    name: 'User',
                    username: 'user',
                    avatarUrl: null,
                    role: data.role || 'LISTENER',
                });
            }
        };

        const onError = (err: any) => {
            console.error("[RoomSocket] Error:", err);
            toast.error(err.message || "Failed to join audio room");
        };

        const onParticipantLeft = (data: { userId: string }) => {
            removeParticipant(data.userId);
        };

        const onHandRaised = (data: { userId: string }) => {
            addRaisedHand(data.userId);
        };

        const onSpeakerApproved = (data: { userId: string }) => {
            updateParticipantRole(data.userId, 'SPEAKER');
            removeRaisedHand(data.userId);
            if (data.userId === userId) {
                setMyRole('SPEAKER');
            }
        };

        const onSpeakerDemoted = (data: { userId: string }) => {
            updateParticipantRole(data.userId, 'LISTENER');
            if (data.userId === userId) {
                setMyRole('LISTENER');
            }
        };

        const onRoomEnded = () => {
            clearRoom();
            // Redirect everyone to the spaces feed
            window.location.href = '/spaces';
        };

        const onSpeakingStatus = (data: { userId: string; isSpeaking: boolean }) => {
            setSpeakingStatus(data.userId, data.isSpeaking);
        };

        socketService.on('audio_room:participant_joined', onParticipantJoined);
        socketService.on('audio_room:participant_left', onParticipantLeft);
        socketService.on('room:hand_raised', onHandRaised);
        socketService.on('room:speaker_approved', onSpeakerApproved);
        socketService.on('room:speaker_demoted', onSpeakerDemoted);
        socketService.on('room:ended', onRoomEnded);
        socketService.on('audio_room:speaking_status', onSpeakingStatus);
        socketService.on('error', onError);

        // Cleanup on unmount
        return () => {
            socketService.send('audio_room:leave', { roomId });
            socketService.off('audio_room:participant_joined', onParticipantJoined);
            socketService.off('audio_room:participant_left', onParticipantLeft);
            socketService.off('room:hand_raised', onHandRaised);
            socketService.off('room:speaker_approved', onSpeakerApproved);
            socketService.off('room:speaker_demoted', onSpeakerDemoted);
            socketService.off('room:ended', onRoomEnded);
            socketService.off('audio_room:speaking_status', onSpeakingStatus);
            socketService.off('error', onError);
        };
    }, [roomId, userId, addParticipant, removeParticipant, updateParticipantRole, addRaisedHand, removeRaisedHand, setMyRole, setSpeakingStatus, clearRoom]);
}
