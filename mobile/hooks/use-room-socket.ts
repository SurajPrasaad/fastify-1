import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth-store';
import { useAudioRoomStore } from '../store/audio-room-store';

let socket: Socket | null = null;

export const useRoomSocket = (roomId: string | null) => {
    const { token, user } = useAuthStore();
    const { 
        addParticipant, 
        removeParticipant, 
        updateParticipantRole, 
        setSpeakingStatus,
        addRaisedHand,
        removeRaisedHand
    } = useAudioRoomStore();

    useEffect(() => {
        if (!roomId || !token || !user) return;

        const baseUrl = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:8080";
        
        socket = io(baseUrl, {
            path: '/chat/socket.io',
            auth: { token },
            transports: ['websocket'],
        });

        socket.on('connect', () => {
            console.log('[RoomSocket] Connected');
            socket?.emit('audio_room:join', { roomId }, (response: any) => {
                if (response.success) {
                    console.log('[RoomSocket] Joined room:', roomId);
                    useAudioRoomStore.getState().setMyRole(response.role);
                    // Initial participants
                    if (response.participants) {
                        const formattedParticipants = response.participants.map((p: any) => ({
                            id: p.userId,
                            name: p.user?.name || p.user?.username,
                            username: p.user?.username,
                            avatarUrl: p.user?.avatarUrl,
                            role: p.role
                        }));
                        useAudioRoomStore.getState().setParticipants(formattedParticipants);
                    }
                }
            });
        });

        socket.on('audio_room:participant_joined', (data) => {
            addParticipant({
                id: data.user.id,
                name: data.user.name,
                username: data.user.username,
                avatarUrl: data.user.avatarUrl,
                role: data.role
            });
        });

        socket.on('audio_room:participant_left', (data) => {
            removeParticipant(data.userId);
        });

        socket.on('audio_room:role_updated', (data) => {
            updateParticipantRole(data.userId, data.role);
            if (data.userId === user.id) {
                useAudioRoomStore.getState().setMyRole(data.role);
            }
        });

        socket.on('audio_room:speaking_status', (data) => {
            setSpeakingStatus(data.userId, data.isSpeaking);
        });

        socket.on('audio_room:hand_raised', (data) => {
            addRaisedHand(data.userId);
        });

        socket.on('audio_room:hand_lowered', (data) => {
            removeRaisedHand(data.userId);
        });

        return () => {
            if (socket) {
                socket.emit('audio_room:leave', { roomId });
                socket.disconnect();
                socket = null;
            }
        };
    }, [roomId, token, user]);

    return {
        send: (event: string, data: any, callback?: (resp: any) => void) => {
            socket?.emit(event, data, callback);
        },
        on: (event: string, handler: (data: any) => void) => {
            socket?.on(event, handler);
        },
        off: (event: string, handler: (data: any) => void) => {
            socket?.off(event, handler);
        }
    };
};
