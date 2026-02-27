"use client"

import React, { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { ChatService } from "@/services/chat.service"
import { ChatRoom } from "@/types/chat"
import { CreateChatDialog } from "./create-chat-dialog"
import { DialogTrigger } from "@/components/ui/dialog"
import { useChatStore } from "@/features/chat/store/chat-store"
import { useUser } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"

interface ChatSidebarProps {
    selectedId: string | null
    onSelect: (id: string, room: ChatRoom) => void
}

export function ChatSidebar({ selectedId, onSelect }: ChatSidebarProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [filter, setFilter] = useState<"all" | "unread" | "groups">("all")
    const onlineUsers = useChatStore(state => state.onlineUsers);
    const { data: currentUser } = useUser();

    const { data: initialConversations, isLoading } = useQuery({
        queryKey: ["chat-rooms"],
        queryFn: () => ChatService.getConversations(),
    })

    const storeConversations = useChatStore(state => state.conversations);
    const setConversations = useChatStore(state => state.setConversations);

    // Sync query data to store once
    useEffect(() => {
        if (initialConversations) {
            setConversations(initialConversations as any[]);
        }
    }, [initialConversations, setConversations]);

    // Use store data for rendering to get real-time updates, bridging the two type systems
    const conversations = initialConversations?.map(c => {
        const storeConv = storeConversations[c._id || (c as any).id];
        if (!storeConv) return c;

        // Merge store data (unread counts, typing) into the query object
        return {
            ...c,
            unreadCount: storeConv.unreadCount,
            lastMessage: storeConv.lastMessage ? {
                senderId: storeConv.lastMessage.senderId,
                content: storeConv.lastMessage.content,
                type: storeConv.lastMessage.type as any,
                createdAt: storeConv.lastMessage.createdAt
            } : c.lastMessage
        };
    }) || [];

    const filteredConversations = conversations?.filter(c => {
        const matchesSearch = getRoomName(c)?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === "all" ||
            (filter === "unread" && (c.unreadCount ?? 0) > 0) ||
            (filter === "groups" && c.type === "GROUP");
        return matchesSearch && matchesFilter;
    })

    function getRoomName(room: ChatRoom | any) {
        if (room.name) return room.name;
        const participants = room.participants || [];
        if (participants.length > 0) {
            const names = participants
                .filter((p: any) => p && String(p.id) !== String(currentUser?.id))
                .map((p: any) => p.name || p.username)
                .join(', ');
            if (names) return names;
        }
        return "Chat Room";
    }

    function isOnline(room: ChatRoom | any) {
        if (room.type === 'GROUP' || room.isGroup) return false;
        const participants = room.participants || [];
        const otherParticipant = participants.find((p: any) => p && String(p.id) !== String(currentUser?.id));
        return otherParticipant ? onlineUsers.has(String(otherParticipant.id)) : false;
    }

    function getAvatar(room: ChatRoom) {
        // Just a placeholder logic for now
        return `https://api.dicebear.com/7.x/beta/svg?seed=${room._id}`;
    }

    return (
        <div className="flex flex-col h-full overflow-hidden bg-white/50 dark:bg-slate-900/50">
            {/* Header */}
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
                    <CreateChatDialog>
                        <DialogTrigger asChild>
                            <button className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                                <span className="material-symbols-outlined">edit_square</span>
                            </button>
                        </DialogTrigger>
                    </CreateChatDialog>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary">
                        search
                    </span>
                    <input
                        className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary/20 placeholder:text-slate-500 transition-all text-sm outline-none"
                        placeholder="Search conversations..."
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="px-6 flex gap-2 mb-4">
                <FilterButton
                    label="All"
                    active={filter === "all"}
                    onClick={() => setFilter("all")}
                />
                <FilterButton
                    label="Unread"
                    active={filter === "unread"}
                    onClick={() => setFilter("unread")}
                />
                <FilterButton
                    label="Groups"
                    active={filter === "groups"}
                    onClick={() => setFilter("groups")}
                />
            </div>

            {/* Chats List */}
            <div className="flex-1 overflow-y-auto hidden-scrollbar">
                {isLoading ? (
                    <div className="flex flex-col">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="px-6 py-4 flex gap-4 items-center">
                                <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-10" />
                                    </div>
                                    <Skeleton className="h-3 w-full opacity-60" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredConversations?.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500">No conversations found.</div>
                ) : (
                    <div className="flex flex-col">
                        {filteredConversations?.map((chat: any) => (
                            <ChatListItem
                                key={chat._id || chat.id}
                                chat={chat}
                                name={getRoomName(chat)}
                                active={selectedId === (chat._id || chat.id)}
                                isOnline={isOnline(chat)}
                                onClick={() => onSelect(chat._id || chat.id, chat)}
                                avatar={getAvatar(chat)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function FilterButton({ label, active, onClick }: { label: string, active?: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                active
                    ? "bg-primary text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            )}
        >
            {label}
        </button>
    )
}

function ChatListItem({ chat, name, active, onClick, avatar, isOnline }: {
    chat: ChatRoom,
    name: string,
    active: boolean,
    isOnline: boolean,
    onClick: () => void,
    avatar: string
}) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center gap-4 px-6 py-4 cursor-pointer transition-all border-l-4",
                active
                    ? "bg-primary/5 border-primary"
                    : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/50"
            )}
        >
            <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                    <img alt={name} className="w-full h-full object-cover" src={avatar} />
                </div>
                {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className={cn("truncate", active ? "font-bold text-slate-900 dark:text-slate-100" : "font-semibold text-slate-900 dark:text-slate-100")}>
                        {name}
                    </h3>
                </div>
                <div className="flex justify-between items-center gap-2">
                    <p className="text-sm text-slate-500/80 dark:text-slate-400 truncate">
                        {chat.lastMessage?.type === 'IMAGE' ? "📷 Sent an image" :
                            chat.lastMessage?.type === 'VIDEO' ? "🎥 Sent a video" :
                                chat.lastMessage?.type === 'FILE' ? "📎 Sent a file" :
                                    chat.lastMessage?.content || "Starting a conversation..."}
                    </p>
                    {chat.unreadCount !== undefined && chat.unreadCount > 0 && (
                        <span className="bg-primary text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center animate-in zoom-in-0">
                            {chat.unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
