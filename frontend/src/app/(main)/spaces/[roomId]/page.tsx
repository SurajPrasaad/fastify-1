"use client"

import React, { useEffect } from 'react';
import { Mic, MicOff, Users, Hand, Settings, LogOut, PhoneOff, Disc, MoreVertical, ShieldAlert } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { useAudioRoomStore } from '@/store/audio-room.store';
import { useRoomSocket } from '@/hooks/use-room-socket';
import { useAuth } from '@/features/auth/components/AuthProvider';

export default function AudioRoomPage({ params: paramsPromise }: { params: Promise<{ roomId: string }> }) {
    const params = React.use(paramsPromise);
    const { roomId } = params;
    const { user: me } = useAuth();

    // 1. Fetch Room Data
    const { data: roomInfo, isLoading } = trpc.rooms.getRoom.useQuery({ roomId }, { enabled: !!roomId });

    // 2. State Management
    const {
        roomId: storedRoomId,
        title,
        hostId,
        speakers,
        listeners,
        raisedHands,
        setRoomData,
        setMyRole,
        myRole,
        clearRoom
    } = useAudioRoomStore();

    // 3. Connect Signaling
    useRoomSocket(roomId, me?.id);

    useEffect(() => {
        if (roomInfo) {
            setRoomData({
                id: roomInfo.id,
                title: roomInfo.title,
                hostId: roomInfo.hostId,
                status: (roomInfo.status as any) || 'ACTIVE'
            });

            // Sync participants
            if (roomInfo.participants) {
                const participants = roomInfo.participants.map((p: any) => ({
                    id: p.user.id,
                    name: p.user.name,
                    username: p.user.username,
                    avatarUrl: p.user.avatarUrl,
                    role: p.role,
                }));

                useAudioRoomStore.getState().setParticipants(participants);
            }

            // Sync initial raised hands
            if ((roomInfo as any).raisedHands) {
                useAudioRoomStore.setState({ raisedHands: (roomInfo as any).raisedHands });
            }

            // Determine my role
            if (me?.id === roomInfo.hostId) {
                setMyRole('HOST');
            } else {
                const amISpeaker = roomInfo.participants?.some((p: any) => p.user.id === me?.id && p.role === 'SPEAKER');
                setMyRole(amISpeaker ? 'SPEAKER' : 'LISTENER');
            }
        }
    }, [roomInfo, setRoomData, me, setMyRole]);

    // Cleanup on exit
    useEffect(() => {
        return () => {
            clearRoom();
        };
    }, [clearRoom]);

    const raiseHandMutation = trpc.rooms.raiseHand.useMutation();
    const approveSpeakerMutation = trpc.rooms.approveSpeaker.useMutation();
    const demoteSpeakerMutation = trpc.rooms.demoteSpeaker.useMutation();

    const handleRaiseHand = () => {
        raiseHandMutation.mutate({ roomId });
    };

    const handleApproveSpeaker = (listenerId: string) => {
        approveSpeakerMutation.mutate({ roomId, listenerId });
    };

    const handleDemoteSpeaker = (speakerId: string) => {
        demoteSpeakerMutation.mutate({ roomId, speakerId });
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-black">
                <Disc className="animate-spin text-[#1d9bf0]" size={48} />
            </div>
        );
    }

    if (!roomInfo) {
        return (
            <div className="flex h-screen items-center justify-center bg-black text-white">
                Room not found
            </div>
        );
    }

    const speakersList = Array.from(speakers.values());
    const listenersList = Array.from(listeners.values());
    const host = speakers.get(hostId || '');

    return (
        <div className="flex flex-col h-screen max-h-screen bg-[#000000] text-gray-100 font-sans">

            {/* Top Header / Room Metadata */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60 bg-[#16181c]/80 backdrop-blur-md sticky top-0 z-50">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white mb-1">
                        {title}
                    </h1>
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-400">
                        <span className="flex items-center gap-1.5 bg-red-500/10 text-red-500 px-2.5 py-0.5 rounded-full text-xs animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                            LIVE
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Users size={16} />
                            {speakersList.length + listenersList.length} listening
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {myRole === 'LISTENER' && (
                        <button
                            onClick={handleRaiseHand}
                            disabled={raiseHandMutation.isPending || raisedHands.includes(me?.id || '')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors active:scale-95 shadow-sm disabled:opacity-50 ${raisedHands.includes(me?.id || '')
                                ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30'
                                : 'bg-gray-800 hover:bg-gray-700 text-white'
                                }`}
                        >
                            <Hand size={16} />
                            {raiseHandMutation.isPending ? 'Requesting...' : raisedHands.includes(me?.id || '') ? 'Request Pending' : 'Raise Hand'}
                        </button>
                    )}

                    {/* Action Menu (Leave Room) */}
                    <Link href="/spaces">
                        <button className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-semibold rounded-full transition-colors active:scale-95 shadow-sm border border-red-500/20">
                            <LogOut size={16} />
                            Leave
                        </button>
                    </Link>
                </div>
            </header>

            {/* Main Studio Area */}
            <main className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar">
                <div className="max-w-5xl mx-auto space-y-12">

                    {/* HOST & SPEAKERS STAGE */}
                    <section>
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                            <Mic size={16} /> Stage
                        </h2>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">

                            {/* Render Speakers */}
                            {speakersList.map((speaker) => (
                                <div key={speaker.id} className="flex flex-col items-center gap-3">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <div className="relative group cursor-pointer transition-transform hover:scale-105">
                                                {/* Active Speaker Ring */}
                                                <div className={`absolute -inset-1.5 rounded-full z-0 transition-opacity duration-300 ${speaker.isSpeaking ? 'bg-gradient-to-r from-blue-500 to-[#1d9bf0] opacity-100 animate-pulse' : 'opacity-0'}`} />

                                                <img
                                                    src={speaker.avatarUrl || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"}
                                                    alt={speaker.name}
                                                    className="w-20 h-20 rounded-full border-[3px] border-[#16181c] relative z-10 object-cover shadow-xl"
                                                />

                                                <div className="absolute -bottom-1 -right-1 z-20 bg-gray-900 rounded-full p-1 border border-gray-700 shadow-sm">
                                                    {speaker.isMuted ? (
                                                        <MicOff className="text-red-400" size={14} />
                                                    ) : (
                                                        <Mic className="text-[#1d9bf0] drop-shadow-sm" size={14} />
                                                    )}
                                                </div>
                                            </div>
                                        </DropdownMenuTrigger>
                                        {(myRole === 'HOST' && speaker.id !== hostId) && (
                                            <DropdownMenuContent className="bg-[#16181c] border-gray-800 text-gray-200 w-48">
                                                <DropdownMenuItem
                                                    onClick={() => handleDemoteSpeaker(speaker.id)}
                                                    className="flex items-center gap-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer focus:bg-red-500/10 focus:text-red-400"
                                                >
                                                    <ShieldAlert size={16} />
                                                    <span>Move to Audience</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        )}
                                    </DropdownMenu>
                                    <div className="text-center">
                                        <p className="font-bold text-[#e7e9ea] text-[15px]">{speaker.name}</p>
                                        <p className={`${speaker.id === hostId ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800/50 text-[#71767b]'} text-xs font-medium inline-block px-2 py-0.5 rounded text-center mt-1`}>
                                            {speaker.id === hostId ? 'Host' : 'Speaker'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* SPEAKER REQUESTS (Only for HOST) */}
                    {myRole === 'HOST' && raisedHands.length > 0 && (
                        <section className="bg-blue-500/5 rounded-2xl border border-blue-500/20 p-6 animate-in slide-in-from-right duration-500">
                            <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Hand size={16} /> Speaker Requests ({raisedHands.length})
                            </h2>
                            <div className="flex flex-wrap gap-4">
                                {raisedHands.map((userId) => {
                                    const user = listeners.get(userId);
                                    if (!user) return null;
                                    return (
                                        <div key={userId} className="flex items-center gap-3 bg-[#16181c] p-2 pr-4 rounded-full border border-gray-800">
                                            <img
                                                src={user.avatarUrl || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"}
                                                alt={user.name}
                                                className="w-8 h-8 rounded-full border border-gray-700"
                                            />
                                            <div className="flex flex-col min-w-[80px]">
                                                <span className="text-xs font-bold text-white leading-tight">{user.name}</span>
                                                <span className="text-[10px] text-gray-500">@{user.username}</span>
                                            </div>
                                            <button
                                                onClick={() => handleApproveSpeaker(userId)}
                                                disabled={approveSpeakerMutation.isPending && approveSpeakerMutation.variables?.listenerId === userId}
                                                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-bold rounded-full transition-colors active:scale-95 disabled:opacity-50"
                                            >
                                                {approveSpeakerMutation.isPending && approveSpeakerMutation.variables?.listenerId === userId ? '...' : 'Approve'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* AUDIENCE LIST (LISTENERS) */}
                    <section className="pt-8 border-t border-gray-800/50">
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                            <Users size={16} /> Audience ({listenersList.length})
                        </h2>

                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-x-4 gap-y-6">
                            {listenersList.map((listener) => (
                                <div key={listener.id} className="flex flex-col items-center gap-2 group cursor-default">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <img
                                                src={listener.avatarUrl || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"}
                                                alt={listener.name}
                                                className="w-12 h-12 rounded-full border-2 border-transparent group-hover:border-gray-700 transition-colors object-cover cursor-pointer hover:scale-105 transition-transform"
                                            />
                                        </DropdownMenuTrigger>
                                        {myRole === 'HOST' && (
                                            <DropdownMenuContent className="bg-[#16181c] border-gray-800 text-gray-200 w-48">
                                                <DropdownMenuItem
                                                    onClick={() => handleApproveSpeaker(listener.id)}
                                                    className="flex items-center gap-2 text-[#1d9bf0] hover:text-[#1a8cd8] hover:bg-blue-500/10 cursor-pointer focus:bg-blue-500/10 focus:text-[#1a8cd8]"
                                                >
                                                    <Mic size={16} />
                                                    <span>Invite to Speak</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        )}
                                    </DropdownMenu>
                                    <p className="text-xs text-[#e7e9ea] font-bold truncate w-full text-center">
                                        {listener.name?.split(' ')[0] || listener.username}
                                    </p>
                                    <p className="text-[9px] text-[#71767b] font-bold uppercase tracking-[0.1em] bg-gray-800/40 px-1.5 py-0.5 rounded mt-0.5">
                                        {listener.role}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                </div>
            </main>

            {/* Floating Bottom Audio Controls (Always visible, sticky) */}
            <footer className="border-t border-gray-800 bg-[#16181c]/95 backdrop-blur-xl p-4 sticky bottom-0 z-50">
                <div className="max-w-2xl mx-auto flex items-center justify-between">

                    <div className="flex items-center gap-4">
                        {/* Main Mic Toggle - Only for Speakers/Host */}
                        {(myRole === 'HOST' || myRole === 'SPEAKER') ? (
                            <button className="flex items-center justify-center w-14 h-14 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white rounded-full shadow-lg shadow-[#1d9bf0]/20 transition-transform active:scale-90">
                                <Mic size={24} />
                            </button>
                        ) : (
                            <div className="w-14 h-14 bg-gray-800 flex items-center justify-center rounded-full text-gray-500 cursor-not-allowed">
                                <MicOff size={24} />
                            </div>
                        )}
                        <div className="text-sm">
                            <p className="text-white font-semibold">
                                {myRole === 'LISTENER' ? 'Listening only' : 'Microphone Ready'}
                            </p>
                            <p className="text-[#1d9bf0] text-[10px] font-bold uppercase tracking-widest mt-0.5">
                                Your Role: {myRole}
                            </p>
                            <p className="text-gray-400 text-xs text-green-400 flex items-center gap-1 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                Connected to Studio
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="p-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full transition-colors active:scale-95" title="Room Settings">
                            <Settings size={20} />
                        </button>
                    </div>

                </div>
            </footer>
        </div>
    );
}
