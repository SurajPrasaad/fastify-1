"use client"

import * as React from "react"
import { ChatSidebar } from "./chat-sidebar"
import { ChatWindow } from "./chat-window"
import { ChatRoom } from "@/types/chat"

export function ChatLayout() {
    const [selectedRoom, setSelectedRoom] = React.useState<ChatRoom | null>(null)

    return (
        <div className="flex h-[calc(100vh-8rem)] w-full overflow-hidden rounded-lg border bg-background shadow-sm">
            {/* Sidebar */}
            <div className={`flex w-full flex-col border-r md:w-[320px] lg:w-[360px] ${selectedRoom ? 'hidden md:flex' : 'flex'}`}>
                <ChatSidebar
                    selectedId={selectedRoom?._id || null}
                    onSelect={(id, room) => setSelectedRoom(room)}
                />
            </div>

            {/* Chat Window */}
            <div className={`flex-1 flex-col bg-muted/10 ${selectedRoom ? 'flex' : 'hidden md:flex'}`}>
                {selectedRoom ? (
                    <ChatWindow roomId={selectedRoom._id} room={selectedRoom} />
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        Select a conversation to start chatting
                    </div>
                )}
            </div>
        </div>
    )
}
