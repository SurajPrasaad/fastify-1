import { create } from 'zustand';
import { Participant, RoomRole } from '../types/space';

interface AudioRoomState {
    roomId: string | null;
    title: string;
    hostId: string;
    myRole: RoomRole;
    speakers: Map<string, Participant>;
    listeners: Map<string, Participant>;
    raisedHands: string[];
    isMuted: boolean;

    // Actions
    setRoomData: (data: { id: string; title: string; hostId: string }) => void;
    setParticipants: (participants: Participant[]) => void;
    addParticipant: (participant: Participant) => void;
    removeParticipant: (userId: string) => void;
    updateParticipantRole: (userId: string, role: RoomRole) => void;
    setSpeakingStatus: (userId: string, isSpeaking: boolean) => void;
    setMyRole: (role: RoomRole) => void;
    addRaisedHand: (userId: string) => void;
    removeRaisedHand: (userId: string) => void;
    setMuted: (isMuted: boolean) => void;
    clearRoom: () => void;
}

export const useAudioRoomStore = create<AudioRoomState>((set, get) => ({
    roomId: null,
    title: '',
    hostId: '',
    myRole: 'LISTENER',
    speakers: new Map(),
    listeners: new Map(),
    raisedHands: [],
    isMuted: false,

    setRoomData: (data) => set({ 
        roomId: data.id, 
        title: data.title, 
        hostId: data.hostId 
    }),

    setParticipants: (participants) => {
        const speakers = new Map<string, Participant>();
        const listeners = new Map<string, Participant>();
        
        participants.forEach(p => {
            if (p.role === 'HOST' || p.role === 'SPEAKER') {
                speakers.set(p.id, p);
            } else {
                listeners.set(p.id, p);
            }
        });
        
        set({ speakers, listeners });
    },

    addParticipant: (participant) => {
        const { speakers, listeners } = get();
        if (participant.role === 'HOST' || participant.role === 'SPEAKER') {
            const newSpeakers = new Map(speakers);
            newSpeakers.set(participant.id, participant);
            set({ speakers: newSpeakers });
        } else {
            const newListeners = new Map(listeners);
            newListeners.set(participant.id, participant);
            set({ listeners: newListeners });
        }
    },

    removeParticipant: (userId) => {
        const { speakers, listeners, raisedHands } = get();
        const newSpeakers = new Map(speakers);
        const newListeners = new Map(listeners);
        
        newSpeakers.delete(userId);
        newListeners.delete(userId);
        
        set({ 
            speakers: newSpeakers, 
            listeners: newListeners,
            raisedHands: raisedHands.filter(id => id !== userId)
        });
    },

    updateParticipantRole: (userId, role) => {
        const { speakers, listeners } = get();
        const newSpeakers = new Map(speakers);
        const newListeners = new Map(listeners);
        
        let p = newSpeakers.get(userId) || newListeners.get(userId);
        if (p) {
            p = { ...p, role };
            newSpeakers.delete(userId);
            newListeners.delete(userId);
            
            if (role === 'HOST' || role === 'SPEAKER') {
                newSpeakers.set(userId, p);
            } else {
                newListeners.set(userId, p);
            }
        }
        
        set({ speakers: newSpeakers, listeners: newListeners });
    },

    setSpeakingStatus: (userId, isSpeaking) => {
        const { speakers } = get();
        if (speakers.has(userId)) {
            const newSpeakers = new Map(speakers);
            const p = newSpeakers.get(userId)!;
            newSpeakers.set(userId, { ...p, isSpeaking });
            set({ speakers: newSpeakers });
        }
    },

    setMyRole: (myRole) => set({ myRole }),

    addRaisedHand: (userId) => set((state) => ({
        raisedHands: state.raisedHands.includes(userId) ? state.raisedHands : [...state.raisedHands, userId]
    })),

    removeRaisedHand: (userId) => set((state) => ({
        raisedHands: state.raisedHands.filter(id => id !== userId)
    })),

    setMuted: (isMuted) => set({ isMuted }),

    clearRoom: () => set({
        roomId: null,
        title: '',
        hostId: '',
        myRole: 'LISTENER',
        speakers: new Map(),
        listeners: new Map(),
        raisedHands: [],
        isMuted: false
    })
}));
