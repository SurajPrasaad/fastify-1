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
import { BlockGuard } from "@/features/block/components/BlockGuard"
import { useQueryClient } from "@tanstack/react-query"

interface ChatWindowProps {
    roomId: string
    room: ChatRoom | undefined
    onBack?: () => void
}

export function ChatWindow({ roomId, room, onBack }: ChatWindowProps) {
    const { data: currentUser } = useUser();
    const { messages: socketMessages, sendMessage, sendTyping, typingUsers, markAsRead } = useChatSocket(roomId)
    const queryClient = useQueryClient();

    const otherUserId = room?.participants.find(p => String(p) !== String(currentUser?.id));

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
    }, [allMessages, typingUsers]);

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
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                            <img
                                alt={room?.name}
                                className="w-full h-full object-cover"
                                src={`https://api.dicebear.com/7.x/beta/svg?seed=${roomId}`}
                            />
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold leading-none mb-1">{room?.name || "Chat"}</h2>
                        <div className="flex items-center gap-1.5">
                            <span className={cn("w-1.5 h-1.5 rounded-full", typingUsers.length > 0 ? "bg-primary animate-pulse" : "bg-green-500")}></span>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                {typingUsers.length > 0 ? "Typing..." : "Online"}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <HeaderButton icon="info" />
                </div>
            </header>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 hidden-scrollbar bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent">
                <div className="flex justify-center my-4">
                    <span className="px-4 py-1 rounded-full bg-slate-100 dark:bg-slate-800/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Today</span>
                </div>

                {isLoading && <div className="text-center text-sm text-slate-500">Loading messages...</div>}

                {allMessages.map((msg, i) => {
                    const isSelf = String(msg.senderId) === String(currentUser?.id) || msg.senderId === 'me';
                    return (
                        <div key={msg._id || i} className={cn("flex gap-3 max-w-[80%]", isSelf ? "ml-auto flex-row-reverse" : "mr-auto")}>
                            {!isSelf && (
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 self-end mb-1 shrink-0">
                                    <img alt="User" src={`https://api.dicebear.com/7.x/beta/svg?seed=${msg.senderId}`} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className={cn("flex flex-col gap-1", isSelf ? "items-end" : "items-start")}>
                                <div className={cn(
                                    "px-5 py-3 rounded-2xl shadow-sm leading-relaxed text-sm overflow-hidden",
                                    isSelf
                                        ? "bg-primary text-white rounded-br-none shadow-primary/20"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none",
                                    (msg.type === 'IMAGE' || msg.type === 'VIDEO') && "p-1"
                                )}>
                                    {msg.type === 'IMAGE' ? (
                                        <img
                                            src={msg.mediaUrl || msg.content}
                                            alt="Shared image"
                                            className="max-h-[300px] w-full object-cover rounded-xl"
                                        />
                                    ) : msg.type === 'VIDEO' ? (
                                        <video
                                            src={msg.mediaUrl || msg.content}
                                            controls
                                            className="max-h-[300px] w-full rounded-xl"
                                        />
                                    ) : msg.type === 'FILE' ? (
                                        <a
                                            href={msg.mediaUrl || msg.content}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 underline underline-offset-4"
                                        >
                                            <span className="material-symbols-outlined">attachment</span>
                                            File Attachment
                                        </a>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                                <div className="flex items-center gap-1 mx-2">
                                    <span className="text-[10px] text-slate-400 font-medium">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {isSelf && (
                                        <span className="material-symbols-outlined text-[14px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                                            check_circle
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
                <div ref={scrollRef} />
            </div>

            {/* Bottom Input Tray */}
            <footer className="p-6 bg-white dark:bg-background-dark/95 border-t border-slate-200 dark:border-slate-800 transition-all">
                <div className="max-w-4xl mx-auto flex items-end gap-3 px-4">
                    <div className="flex items-center gap-1 mb-1 relative" ref={emojiPickerRef} {...getRootProps()}>
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
                    <div className="flex-1 relative">
                        <textarea
                            className="w-full py-3 px-5 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 resize-none max-h-32 text-sm leading-relaxed placeholder:text-slate-500 outline-none transition-all"
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
                        className="w-12 h-12 rounded-2xl flex items-center justify-center bg-primary text-white shadow-lg shadow-primary/30 hover:scale-105 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined rotate-[-45deg] mb-0.5 ml-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                    </button>
                </div>
            </footer>
        </div>
    )
}

function HeaderButton({ icon }: { icon: string }) {
    return (
        <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
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
