import { create } from 'zustand';

export interface Participant {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
    role: 'HOST' | 'SPEAKER' | 'LISTENER';
    isSpeaking?: boolean;
    isMuted?: boolean;
}

interface AudioRoomState {
    roomId: string | null;
    title: string;
    status: 'ACTIVE' | 'ENDED' | 'CONNECTING' | 'IDLE';
    hostId: string | null;
    myRole: 'HOST' | 'SPEAKER' | 'LISTENER';
    speakers: Map<string, Participant>;
    listeners: Map<string, Participant>;
    raisedHands: string[]; // User IDs

    // Actions
    setRoomData: (data: { id: string; title: string; hostId: string; status: string }) => void;
    setParticipants: (participants: Participant[]) => void;
    addParticipant: (participant: Participant) => void;
    removeParticipant: (userId: string) => void;
    updateParticipantRole: (userId: string, role: 'HOST' | 'SPEAKER' | 'LISTENER') => void;
    setMyRole: (role: 'HOST' | 'SPEAKER' | 'LISTENER') => void;
    addRaisedHand: (userId: string) => void;
    removeRaisedHand: (userId: string) => void;
    clearRoom: () => void;
}

export const useAudioRoomStore = create<AudioRoomState>((set) => ({
    roomId: null,
    title: '',
    status: 'IDLE',
    hostId: null,
    myRole: 'LISTENER',
    speakers: new Map(),
    listeners: new Map(),
    raisedHands: [],

    setRoomData: (data) => set({
        roomId: data.id,
        title: data.title,
        hostId: data.hostId,
        status: data.status as any,
    }),

    setParticipants: (participants) => set((state) => {
        const speakers = new Map<string, Participant>();
        const listeners = new Map<string, Participant>();

        participants.forEach(p => {
            const isHost = p.id === state.hostId;
            const finalRole = isHost ? 'HOST' : p.role;
            const finalParticipant = { ...p, role: finalRole };

            if (finalRole === 'SPEAKER' || finalRole === 'HOST') {
                speakers.set(p.id, finalParticipant);
            } else {
                listeners.set(p.id, finalParticipant);
            }
        });
        return { speakers, listeners };
    }),

    addParticipant: (participant) => set((state) => {
        const speakers = new Map(state.speakers);
        const listeners = new Map(state.listeners);

        // Force host role and location
        const isHost = participant.id === state.hostId;
        const finalRole = isHost ? 'HOST' : participant.role;
        const finalParticipant = { ...participant, role: finalRole };

        if (finalRole === 'SPEAKER' || finalRole === 'HOST') {
            speakers.set(participant.id, finalParticipant);
            listeners.delete(participant.id);
        } else {
            listeners.set(participant.id, finalParticipant);
            speakers.delete(participant.id);
        }
        return { speakers, listeners };
    }),

    removeParticipant: (userId) => set((state) => {
        const speakers = new Map(state.speakers);
        const listeners = new Map(state.listeners);
        speakers.delete(userId);
        listeners.delete(userId);
        const raisedHands = state.raisedHands.filter(id => id !== userId);
        return { speakers, listeners, raisedHands };
    }),

    updateParticipantRole: (userId, role) => set((state) => {
        const speakers = new Map(state.speakers);
        const listeners = new Map(state.listeners);
        let p: Participant | undefined = speakers.get(userId) || listeners.get(userId);

        if (p) {
            // Force host role and location
            const isHost = userId === state.hostId;
            const finalRole = isHost ? 'HOST' : role;

            speakers.delete(userId);
            listeners.delete(userId);

            const updatedP = { ...p, role: finalRole };
            if (finalRole === 'SPEAKER' || finalRole === 'HOST') {
                speakers.set(userId, updatedP);
            } else {
                listeners.set(userId, updatedP);
            }
        }
        return { speakers, listeners };
    }),

    setMyRole: (role) => set({ myRole: role }),

    addRaisedHand: (userId) => set((state) => ({
        raisedHands: state.raisedHands.includes(userId)
            ? state.raisedHands
            : [...state.raisedHands, userId]
    })),

    removeRaisedHand: (userId) => set((state) => ({
        raisedHands: state.raisedHands.filter(id => id !== userId)
    })),

    clearRoom: () => set({
        roomId: null,
        title: '',
        status: 'IDLE',
        hostId: null,
        myRole: 'LISTENER',
        speakers: new Map(),
        listeners: new Map(),
        raisedHands: [],
    }),
}));
