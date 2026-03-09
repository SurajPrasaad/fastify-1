"use client"

import React from 'react';
import Link from 'next/link';
import { Play, Users, Disc, Search, Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { formatDistanceToNow } from 'date-fns';

export default function SpacesIndexPage() {
    const { data: roomsData, isLoading } = trpc.rooms.getActiveRooms.useQuery({
        limit: 20
    });

    const createRoomMutation = trpc.rooms.createRoom.useMutation({
        onSuccess: (data) => {
            // Redirect to new room
            window.location.href = `/spaces/${data.id}`;
        }
    });

    const handleCreateRoom = () => {
        const title = prompt("Enter Space Title:");
        if (title) {
            createRoomMutation.mutate({ title });
        }
    };

    return (
        <div className="flex-1 min-h-screen bg-[#000000] border-x border-[#2f3336]">
            {/* Sticky Top Header */}
            <header className="sticky top-0 z-10 bg-[#000000]/80 backdrop-blur-md px-4 py-3 border-b border-[#2f3336] flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-[#e7e9ea]">Spaces / Audio Rooms</h1>
                    <p className="text-sm font-normal text-[#71767b]">Happening right now across DevAtlas</p>
                </div>
                <button
                    onClick={handleCreateRoom}
                    disabled={createRoomMutation.isLoading}
                    className="bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                    <Plus size={18} />
                    Start a Space
                </button>
            </header>

            {/* Main Content */}
            <main className="p-4 space-y-6">

                {/* Search & Filter Bar */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <Search className="w-5 h-5 text-[#71767b] group-focus-within:text-[#1d9bf0]" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search active Spaces..."
                        className="w-full bg-[#202327] outline-none text-[#e7e9ea] text-[15px] rounded-full pl-12 pr-4 py-3 focus:bg-[#000000] focus:ring-1 focus:ring-[#1d9bf0] transition-colors border border-transparent focus:border-[#1d9bf0]"
                    />
                </div>

                {/* Live Spaces Feed */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Disc className="animate-spin text-[#1d9bf0]" size={32} />
                        </div>
                    ) : roomsData?.rooms.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-[#71767b] mb-4">No active spaces found. Why not start one?</p>
                        </div>
                    ) : (
                        roomsData?.rooms.map((room) => (
                            <Link key={room.id} href={`/spaces/${room.id}`} className="block">
                                <div className="bg-[#16181c] hover:bg-[#1c1f23] border border-[#2f3336] rounded-2xl p-4 transition-colors duration-200 cursor-pointer group">

                                    {/* Status Indicator */}
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#1d9bf0] bg-[#1d9bf0]/10 px-2.5 py-1 rounded-md">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#1d9bf0] animate-pulse"></span>
                                            Live Now
                                        </span>

                                        <span className="text-[#71767b] text-xs">
                                            {room.createdAt ? formatDistanceToNow(new Date(room.createdAt)) + ' ago' : ''}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h2 className="text-[17px] font-bold text-[#e7e9ea] mb-4 leading-tight group-hover:underline decoration-[#71767b]">
                                        {room.title}
                                    </h2>

                                    {/* Host Info & Stats */}
                                    <div className="flex items-end justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex -space-x-2">
                                                <img
                                                    src={room.host.avatarUrl || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"}
                                                    alt="host"
                                                    className="w-8 h-8 rounded-full border-2 border-[#16181c] object-cover ring-2 ring-[#1d9bf0]/20"
                                                />
                                            </div>

                                            <div className="text-sm">
                                                <span className="text-[#e7e9ea] font-medium mr-1">{room.host.name || room.host.username}</span>
                                                <span className="text-[#71767b]">is hosting</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 text-[#71767b] text-sm">
                                            <span className="flex items-center gap-1.5">
                                                <Users size={14} />
                                                <span className="font-medium text-[#e7e9ea]">Join Space</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="h-1 w-full mt-4 bg-gradient-to-r from-[#1d9bf0]/0 via-[#1d9bf0]/40 to-[#1d9bf0]/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>

                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
