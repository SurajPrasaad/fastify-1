"use client"

import { useState, useRef, useEffect } from "react"
import { Phone, Video, MoreVertical, Send } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useQuery } from "@tanstack/react-query"
import { ChatService } from "@/services/chat.service"
import { useChatSocket } from "@/hooks/use-chat-socket"
import { ChatRoom } from "@/types/chat"
import { useUser } from "@/hooks/use-auth"

import { BlockButton } from "@/features/block/components/BlockButton"
import { BlockGuard } from "@/features/block/components/BlockGuard"

interface ChatWindowProps {
    roomId: string
    room: ChatRoom | undefined
}

export function ChatWindow({ roomId, room }: ChatWindowProps) {
    const { data: currentUser } = useUser();
    const { messages: socketMessages, sendMessage, sendTyping, typingUsers } = useChatSocket(roomId)

    const otherUserId = room?.participants.find(p => String(p) !== String(currentUser?.id));

    const { data: initialMessages, isLoading } = useQuery({
        queryKey: ["chat-history", roomId],
        queryFn: () => ChatService.getHistory(roomId),
        enabled: !!roomId,
    })

    const [input, setInput] = useState("")
    const scrollRef = useRef<HTMLDivElement>(null)

    // ... Deduplication and message sorting logic ...
    const history = initialMessages ? [...initialMessages].reverse() : [];
    const combined = [...history, ...socketMessages];

    const consolidated = combined.reduce((acc: any[], msg) => {
        const existingById = acc.findIndex(m => String(m._id) === String(msg._id));
        if (existingById !== -1) {
            if (msg.status !== 'SENDING') acc[existingById] = msg;
            return acc;
        }
        if (msg.status !== 'SENDING') {
            const optIdx = acc.findIndex(m =>
                m.status === 'SENDING' &&
                m.content?.trim() === msg.content?.trim()
            );
            if (optIdx !== -1) {
                acc[optIdx] = msg;
                return acc;
            }
        }
        acc.push(msg);
        return acc;
    }, []);

    const allMessages = [...consolidated].sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [allMessages, typingUsers]);

    const handleSend = () => {
        if (!input.trim()) return;
        sendMessage(input);
        setInput("");
        sendTyping(false);
    }

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        sendTyping(e.target.value.length > 0);
    }

    return (
        <div className="flex h-full w-full flex-col bg-muted/10">
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b bg-background px-4">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarFallback>{room?.name?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <div>
                        <span className="block font-semibold">{room?.name || "Chat"}</span>
                        <div className="flex items-center gap-2">
                            {typingUsers.length > 0 && <span className="text-xs text-primary animate-pulse">Typing...</span>}
                            <span className="block text-xs text-muted-foreground">Active now</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {otherUserId && (
                        <BlockButton
                            userId={String(otherUserId)}
                            size="sm"
                            variant="ghost"
                            showLabel={false}
                        />
                    )}
                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
                <div className="flex flex-col gap-4">
                    {isLoading && <div className="text-center text-sm">Loading messages...</div>}
                    {allMessages.map((msg, i) => {
                        const currentUserId = currentUser?.id;
                        const isSelf = String(msg.senderId) === String(currentUserId) || msg.senderId === 'me';

                        return (
                            <div key={msg._id || i} className={`flex w-full ${isSelf ? "justify-end" : "justify-start"}`}>
                                <div
                                    className={`max-w-[75%] px-4 py-2 shadow-sm rounded-xl ${isSelf
                                        ? "bg-primary text-primary-foreground rounded-tr-none shadow-primary/20"
                                        : "bg-white dark:bg-zinc-800 text-foreground border dark:border-zinc-700 rounded-tl-none"
                                        }`}
                                >
                                    <div className="text-sm leading-relaxed break-words">
                                        {msg.content}
                                    </div>
                                    <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isSelf ? "text-green-100" : "text-muted-foreground"}`}>
                                        {msg.status === 'SENDING' && <span className="animate-pulse">Sending...</span>}
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Input Overlay with BlockGuard */}
            <div className="p-4 bg-background border-t">
                {otherUserId ? (
                    <BlockGuard userId={String(otherUserId)}>
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Type a message..."
                                className="flex-1"
                                value={input}
                                onChange={handleTyping}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            />
                            <Button size="icon" onClick={handleSend}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </BlockGuard>
                ) : (
                    <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
                        Select a chat to start messaging
                    </div>
                )}
            </div>
        </div>
    )
}
