import { useEffect } from 'react';
import { socketService } from '@/services/socket.service';
import { useAudioRoomStore, Participant } from '@/store/audio-room.store';
import { trpc } from '@/lib/trpc';

export function useRoomSocket(roomId: string | undefined, userId: string | undefined) {
    const {
        addParticipant,
        removeParticipant,
        updateParticipantRole,
        addRaisedHand,
        removeRaisedHand,
        setMyRole,
        clearRoom
    } = useAudioRoomStore();

    useEffect(() => {
        if (!roomId) return;

        // 1. Connect and join the room channel
        socketService.connect();
        socketService.send('audio_room:join', { roomId });

        // 2. Setup listeners
        const onParticipantJoined = (data: { userId: string; user?: any; role: 'HOST' | 'SPEAKER' | 'LISTENER' }) => {
            // In a real app we might fetch user details if not provided in payload
            // For now assume server sends enough or we handle gracefully
            if (data.user) {
                addParticipant({
                    id: data.user.id,
                    name: data.user.name,
                    username: data.user.username,
                    avatarUrl: data.user.avatarUrl,
                    role: data.role || 'LISTENER',
                });
            }
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
            // Redirect or show message
        };

        socketService.on('audio_room:participant_joined', onParticipantJoined);
        socketService.on('audio_room:participant_left', onParticipantLeft);
        socketService.on('room:hand_raised', onHandRaised); // From backend service event
        socketService.on('room:speaker_approved', onSpeakerApproved);
        socketService.on('room:speaker_demoted', onSpeakerDemoted);
        socketService.on('room:ended', onRoomEnded);

        // Cleanup on unmount
        return () => {
            socketService.send('audio_room:leave', { roomId });
            socketService.off('audio_room:participant_joined', onParticipantJoined);
            socketService.off('audio_room:participant_left', onParticipantLeft);
            socketService.off('room:hand_raised', onHandRaised);
            socketService.off('room:speaker_approved', onSpeakerApproved);
            socketService.off('room:speaker_demoted', onSpeakerDemoted);
            socketService.off('room:ended', onRoomEnded);
        };
    }, [roomId, userId, addParticipant, removeParticipant, updateParticipantRole, addRaisedHand, removeRaisedHand, setMyRole, clearRoom]);
}
