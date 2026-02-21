"use client"

import * as React from "react"
import { ChatSidebar } from "./chat-sidebar"
import { ChatWindow } from "./chat-window"
import { ChatRoom } from "@/types/chat"

export function ChatLayout() {
    const [selectedRoom, setSelectedRoom] = React.useState<ChatRoom | null>(null)

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
            {/* Column 1: Conversations List */}
            <section className={cn(
                "w-full md:w-[380px] flex flex-col border-r border-slate-200 dark:border-slate-800 z-20 transition-all",
                selectedRoom ? "hidden md:flex" : "flex"
            )}>
                <ChatSidebar
                    selectedId={selectedRoom?._id || null}
                    onSelect={(id, room) => setSelectedRoom(room)}
                />
            </section>

            {/* Column 2: Active Chat Window */}
            <main className={cn(
                "flex-1 flex flex-col bg-white dark:bg-background-dark relative transition-all",
                selectedRoom ? "flex" : "hidden md:flex"
            )}>
                {selectedRoom ? (
                    <ChatWindow
                        roomId={selectedRoom._id}
                        room={selectedRoom}
                        onBack={() => setSelectedRoom(null)}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent">
                        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                            <span className="material-symbols-outlined text-4xl">chat</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Your Messages</h3>
                        <p className="text-sm">Select a conversation or start a new one to reach your friends.</p>
                    </div>
                )}
            </main>
        </div>
    )
}

import { cn } from "@/lib/utils"
