"use client"

import { useState } from "react"
import { Search, MoreVertical, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { ChatService } from "@/services/chat.service"
import { ChatRoom } from "@/types/chat"
import { CreateChatDialog } from "./create-chat-dialog"
import { DialogTrigger } from "@/components/ui/dialog"

interface ChatSidebarProps {
    selectedId: string | null
    onSelect: (id: string, room: ChatRoom) => void
}

export function ChatSidebar({ selectedId, onSelect }: ChatSidebarProps) {
    const [searchQuery, setSearchQuery] = useState("")

    const { data: conversations, isLoading } = useQuery({
        queryKey: ["chat-rooms"],
        queryFn: () => ChatService.getConversations(),
    })

    // Filter rooms locally for now since search API returns messages not rooms
    const filteredConversations = conversations?.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.participants.some(p => typeof p === 'string' ? false : (p as any).username?.toLowerCase().includes(searchQuery.toLowerCase()))
        // Note: Participants might be IDs unless populated. The service type says string[] but backend populates minimally?
        // Actually, backend chat.repository.ts `findUserRooms` does NOT populate participants. It just returns the room document.
        // We probably need to update the backend to populate participant details (username, avatar) for the sidebar to be useful.
        // For now, let's assume raw room data and we might need to fetch user details or update backend.
    )

    // Helper to get room display name
    const getRoomName = (room: ChatRoom) => {
        if (room.name) return room.name;
        // Check for populated participants
        if (room.participants && room.participants.length > 0) {
            // Find first participant that looks like an object
            const names = room.participants
                .filter(p => typeof p !== 'string')
                .map((p: any) => p.name || p.username)
                .join(', ');
            if (names) return names;
        }
        return "Chat";
    }

    return (
        <div className="flex w-full flex-col border-r md:w-[320px] lg:w-[360px] h-full">
            <div className="flex items-center justify-between p-4">
                <h2 className="text-xl font-bold">Messages</h2>
                <div className="flex gap-1">
                    <CreateChatDialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                    </CreateChatDialog>
                    <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <div className="px-4 pb-4">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search chats..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            <Separator />

            <ScrollArea className="flex-1">
                <div className="flex flex-col gap-1 p-2">
                    {isLoading && <div className="p-4 text-center text-sm text-muted-foreground">Loading chats...</div>}

                    {!isLoading && filteredConversations?.length === 0 && (
                        <div className="p-4 text-center text-sm text-muted-foreground">No conversations found.</div>
                    )}

                    {filteredConversations?.map((chat) => (
                        <button
                            key={chat._id}
                            onClick={() => onSelect(chat._id, chat)}
                            className={cn(
                                "flex items-start gap-3 rounded-md p-3 text-left transition-colors hover:bg-accent",
                                selectedId === chat._id && "bg-accent"
                            )}
                        >
                            <Avatar>
                                <AvatarFallback>{getRoomName(chat)[0]?.toUpperCase() || "?"}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-1 flex-col overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold">{getRoomName(chat)}</span>
                                    {chat.updatedAt && (
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(chat.updatedAt).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                                <span className="line-clamp-1 text-sm text-muted-foreground">
                                    {chat.lastMessage?.content || "No messages yet"}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}
