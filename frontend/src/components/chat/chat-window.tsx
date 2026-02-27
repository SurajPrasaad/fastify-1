"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import EmojiPicker, { Theme } from "emoji-picker-react"
import { useTheme } from "next-themes"
import { useDropzone } from "react-dropzone"
import { useUpload } from "@/hooks/use-upload"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { ChatService } from "@/services/chat.service"
import { useChatSocket } from "@/hooks/use-chat-socket"
import { ChatRoom } from "@/types/chat"
import { useUser } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"
import { BlockGuard } from "@/features/block/components/BlockGuard"
import { useQueryClient } from "@tanstack/react-query"
import { useChatStore } from "@/features/chat/store/chat-store"
import { useCall } from "@/features/call/context/CallContext"

interface ChatWindowProps {
    roomId: string
    room: ChatRoom | undefined
    onBack?: () => void
}

export function ChatWindow({ roomId, room, onBack }: ChatWindowProps) {
    const { data: currentUser } = useUser();
    const { sendMessage, sendTyping, markAsRead } = useChatSocket(roomId)
    const { initiateCall } = useCall();
    const messagesByRoom = useChatStore(state => state.messages);
    const conversations = useChatStore(state => state.conversations);
    const onlineUsers = useChatStore(state => state.onlineUsers);

    const storeMessages = messagesByRoom[roomId] || [];
    const conversation = conversations[roomId];
    const typingUsers = conversation?.typingUsers || [];

    const queryClient = useQueryClient();

    const otherParticipant = room?.participants.find(p => {
        const pId = typeof p === 'string' ? p : (p as any).id || (p as any)._id;
        return String(pId) !== String(currentUser?.id);
    });

    const otherUser = typeof otherParticipant === 'string'
        ? { id: otherParticipant, name: 'User', avatarUrl: null, username: 'user' }
        : otherParticipant as any;

    const otherUserId = otherUser?.id || (otherUser as any)?._id;
    const isOtherUserOnline = otherUserId ? onlineUsers.has(String(otherUserId)) : false;

    const { data: initialMessages, isLoading } = useQuery({
        queryKey: ["chat-history", roomId],
        queryFn: () => ChatService.getHistory(roomId),
        enabled: !!roomId,
    })

    const [input, setInput] = useState("")
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const emojiPickerRef = useRef<HTMLDivElement>(null)
    const { theme } = useTheme()
    const { upload, isUploading: isFileUploading } = useUpload()

    const history = initialMessages ? [...initialMessages].reverse() : [];
    const combined = [...history, ...storeMessages];

    const consolidated = combined.reduce((acc: any[], msg) => {
        const msgId = (msg as any)._id || (msg as any).id;
        const existingById = acc.findIndex(m => String((m as any)._id || (m as any).id) === String(msgId));
        if (existingById !== -1) {
            if ((msg as any).status !== 'SENDING') acc[existingById] = msg;
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
        if (allMessages.length > 0) {
            const lastMessage = allMessages[allMessages.length - 1];
            if (lastMessage._id && !lastMessage._id.startsWith('temp-') && lastMessage.senderId !== currentUser?.id) {
                markAsRead(lastMessage._id);
                // Also invalidate the sidebar to clear unread counts immediately
                queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });
            }
        }
    }, [allMessages, roomId, currentUser?.id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [allMessages, typingUsers.length]);

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };

        if (showEmojiPicker) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showEmojiPicker]);

    // Hide mobile bottom nav when chat window is active
    useEffect(() => {
        const nav = document.getElementById("mobile-nav");
        if (nav) nav.style.display = "none";
        return () => {
            if (nav) nav.style.display = "";
        };
    }, []);

    const handleEmojiClick = (emojiData: any) => {
        setInput(prev => prev + emojiData.emoji);
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];
        // 50MB limit for chat
        if (file.size > 50 * 1024 * 1024) {
            toast.error("File size exceeds 50MB limit");
            return;
        }

        let type: 'IMAGE' | 'VIDEO' | 'FILE' = 'FILE';
        if (file.type.startsWith('image/')) type = 'IMAGE';
        else if (file.type.startsWith('video/')) type = 'VIDEO';

        const url = await upload(file, "chat_media");
        if (url) {
            // Send the URL as a message with correct type
            sendMessage(url, type, url);
            toast.success("File uploaded and sent");
        }
    }, [upload, sendMessage]);

    const { getRootProps, getInputProps, open } = useDropzone({
        onDrop,
        noClick: true,
        noKeyboard: true,
        multiple: false
    });

    const handleMarkAllAsRead = async () => {
        if (!roomId) return;
        try {
            await ChatService.markAsRead(roomId);
            queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });
            toast.success("Marked as read");
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    }

    const handleSend = () => {
        if (!input.trim()) return;
        sendMessage(input);
        setInput("");
        sendTyping(false);
    }

    const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        sendTyping(e.target.value.length > 0);
    }

    const handleCall = (type: 'AUDIO' | 'VIDEO') => {
        if (!otherUser) return;
        initiateCall(otherUser.id, otherUser.name, otherUser.avatarUrl || null, type);
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <header className="h-20 flex items-center justify-between px-8 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md z-10 transition-all">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button onClick={onBack} className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                    )}
                    <div className="relative">
                        <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-primary/20 p-0.5 shadow-sm">
                            <img
                                alt={room?.type === 'DIRECT' ? otherUser?.name : room?.name}
                                className="w-full h-full object-cover rounded-full"
                                src={room?.type === 'DIRECT' ? (otherUser?.avatarUrl || `https://api.dicebear.com/7.x/beta/svg?seed=${otherUser?.username}`) : `https://api.dicebear.com/7.x/beta/svg?seed=${roomId}`}
                            />
                        </div>
                        <span className={cn(
                            "absolute bottom-0.5 right-0.5 w-3 h-3 border-2 border-white dark:border-slate-900 rounded-full shadow-sm",
                            isOtherUserOnline ? "bg-green-500" : "bg-slate-300 dark:bg-slate-700"
                        )}></span>
                    </div>
                    <div>
                        <h2 className="text-lg font-extrabold leading-none mb-1 tracking-tight">
                            {room?.type === 'DIRECT' ? otherUser?.name : (room?.name || "Chat")}
                        </h2>
                        <div className="flex items-center gap-1.5">
                            {typingUsers.length > 0 ? (
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1 items-center h-4">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                                    </div>
                                    <p className="text-[11px] text-primary font-bold uppercase tracking-wider">Typing...</p>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5">
                                    <span className={cn("w-1.5 h-1.5 rounded-full", isOtherUserOnline ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-slate-400")}></span>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                                        {isOtherUserOnline ? "Online" : "Offline"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <HeaderButton icon="call" onClick={() => handleCall('AUDIO')} />
                    <HeaderButton icon="videocam" onClick={() => handleCall('VIDEO')} />
                    <HeaderButton icon="info" onClick={handleMarkAllAsRead} />
                </div>
            </header>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6 hidden-scrollbar bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent">
                <div className="flex justify-center my-4">
                    <span className="px-4 py-1 rounded-full bg-slate-100/50 dark:bg-slate-800/30 backdrop-blur-sm text-[10px] font-black text-slate-500/80 uppercase tracking-[0.2em]">Today</span>
                </div>

                {isLoading ? (
                    <div className="flex flex-col gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className={cn("flex gap-3 max-w-[80%]", i % 2 === 0 ? "mr-auto" : "ml-auto flex-row-reverse")}>
                                <Skeleton className="w-8 h-8 rounded-full self-end mb-1 shrink-0" />
                                <div className="flex flex-col gap-1.5">
                                    <Skeleton className={cn("h-12 w-48 sm:w-64 rounded-2xl", i % 2 === 0 ? "rounded-bl-none" : "rounded-br-none")} />
                                    <Skeleton className="h-3 w-12" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {allMessages.map((msg, i) => {
                            const isSelf = String(msg.senderId) === String(currentUser?.id) || msg.senderId === 'me';
                            return (
                                <div key={msg._id || i} className={cn("flex gap-3 max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300", isSelf ? "ml-auto flex-row-reverse" : "mr-auto")}>
                                    {!isSelf && (
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 self-end mb-1 shrink-0 border border-white dark:border-slate-700 shadow-sm">
                                            <img alt="User" src={`https://api.dicebear.com/7.x/beta/svg?seed=${msg.senderId}`} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className={cn("flex flex-col gap-1.5", isSelf ? "items-end" : "items-start")}>
                                        <div className={cn(
                                            "px-5 py-3 rounded-2xl shadow-sm leading-relaxed text-sm overflow-hidden transition-all hover:shadow-md",
                                            isSelf
                                                ? "bg-gradient-to-br from-primary to-primary/80 text-white rounded-br-none shadow-primary/20"
                                                : "bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-100 dark:border-slate-700/50",
                                            (msg.type === 'IMAGE' || msg.type === 'VIDEO') && "p-1.5"
                                        )}>
                                            {msg.type === 'IMAGE' ? (
                                                <div className="relative group overflow-hidden rounded-xl">
                                                    <img
                                                        src={msg.mediaUrl || msg.content}
                                                        alt="Shared image"
                                                        className="max-h-[340px] w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-white text-3xl">zoom_in</span>
                                                    </div>
                                                </div>
                                            ) : msg.type === 'VIDEO' ? (
                                                <video
                                                    src={msg.mediaUrl || msg.content}
                                                    controls
                                                    className="max-h-[340px] w-full rounded-xl shadow-inner"
                                                />
                                            ) : msg.type === 'FILE' ? (
                                                <a
                                                    href={msg.mediaUrl || msg.content}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-3 p-2 bg-black/5 dark:bg-white/5 rounded-xl border border-white/10"
                                                >
                                                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                                        <span className="material-symbols-outlined">description</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-xs truncate max-w-[150px]">File Attachment</span>
                                                        <span className="text-[10px] opacity-70 uppercase font-bold tracking-tighter">Download</span>
                                                    </div>
                                                </a>
                                            ) : (
                                                <p className="font-medium">{msg.content}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 px-1">
                                            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-tighter opacity-70">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isSelf && (
                                                <div className="flex items-center h-4">
                                                    {msg.status === 'SENDING' ? (
                                                        <span className="material-symbols-outlined text-[14px] text-slate-400">
                                                            sync
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className={cn(
                                                                "material-symbols-outlined text-[16px]",
                                                                (msg.status === 'read' || msg.status === 'READ') ? "text-blue-500 font-bold" : "text-slate-400"
                                                            )}
                                                            style={{ fontVariationSettings: "'FILL' 1" }}
                                                        >
                                                            done_all
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}

                {typingUsers.length > 0 && (
                    <div className="flex gap-3 items-center animate-in fade-in slide-in-from-left-2 duration-300">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-white dark:border-slate-700 shadow-sm flex items-center justify-center">
                            <div className="flex gap-1">
                                <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1 h-1 bg-primary rounded-full animate-bounce"></span>
                            </div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">Member is typing...</p>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            {/* Bottom Input Tray */}
            <footer className="p-3 pb-4 sm:p-4 md:p-6 bg-white dark:bg-background-dark/95 border-t border-slate-200 dark:border-slate-800 transition-all">
                <div className="w-full max-w-4xl mx-auto flex items-end gap-2 sm:gap-3 px-1 sm:px-4">
                    <div className="flex items-center gap-1 mb-1 relative shrink-0" ref={emojiPickerRef} {...getRootProps()}>
                        <input {...getInputProps()} />
                        <IconButton
                            icon={isFileUploading ? "sync" : "add_circle"}
                            onClick={open}
                            disabled={isFileUploading}
                            className={cn(isFileUploading && "animate-spin")}
                        />
                        <IconButton
                            icon="mood"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            active={showEmojiPicker}
                        />

                        {showEmojiPicker && (
                            <div className="absolute bottom-14 left-0 z-50">
                                <EmojiPicker
                                    onEmojiClick={handleEmojiClick}
                                    theme={theme === "dark" ? Theme.DARK : Theme.LIGHT}
                                    lazyLoadEmojis={true}
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0 relative">
                        <textarea
                            className="w-full py-3 px-4 sm:px-5 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 resize-none max-h-32 text-sm leading-relaxed placeholder:text-slate-500 outline-none transition-all"
                            placeholder="Type a message..."
                            rows={1}
                            value={input}
                            onChange={handleTyping}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />
                    </div>
                    <button
                        onClick={handleSend}
                        className="w-[42px] h-[42px] sm:w-12 sm:h-12 shrink-0 rounded-2xl flex items-center justify-center bg-primary text-white shadow-lg shadow-primary/30 hover:scale-105 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined rotate-[-45deg] mb-0.5 ml-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                    </button>
                </div>
            </footer>
        </div>
    )
}

function HeaderButton({ icon, onClick }: { icon: string, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
        >
            <span className="material-symbols-outlined transition-transform group-active:scale-90">{icon}</span>
        </button>
    )
}

function IconButton({ icon, onClick, active, disabled, className }: { icon: string, onClick?: () => void, active?: boolean, disabled?: boolean, className?: string }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors group disabled:opacity-50",
                active
                    ? "text-primary bg-primary/10"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800",
                className
            )}
        >
            <span className="material-symbols-outlined transition-transform group-active:scale-90">{icon}</span>
        </button>
    )
}
