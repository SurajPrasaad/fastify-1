
"use client";

import { useChatStore } from '../store/chat-store';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { useAuth } from '@/features/auth/components/AuthProvider';
import { usePresence } from '../hooks/usePresence';

export function ConversationList() {
    const { user } = useAuth();
    const { conversations, activeRoomId, isLoading, presenceMap } = useChatStore();

    // Auto-fetch presence for all participants in visible conversations
    const allUserIds = Array.from(new Set(conversations.flatMap(c => c.participants.map(p => p.id))));
    usePresence(allUserIds);

    if (isLoading.conversations && conversations.length === 0) {
        // ... (loading state remains same)
        return (
            <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="w-12 h-12 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-24 bg-muted rounded" />
                            <div className="h-3 w-full bg-muted rounded" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            {conversations.map((conv) => {
                const isActive = activeRoomId === conv.id;
                const lastMsg = conv.lastMessage;

                // Find the other user (not current user)
                const otherUser = conv.participants.find(p => p.id !== user?.id) || conv.participants[0];
                const presence = presenceMap[otherUser.id];
                const isOnline = presence?.status === 'ONLINE';

                return (
                    <Link
                        key={conv.id}
                        href={`/chat/${conv.id}`}
                        className={cn(
                            "group flex items-center gap-3 p-4 transition-colors hover:bg-accent/50",
                            isActive && "bg-accent"
                        )}
                    >
                        <div className="relative">
                            <Avatar className="h-12 w-12 border">
                                <AvatarImage src={otherUser?.avatarUrl} />
                                <AvatarFallback>{otherUser?.name?.[0] || '?'}</AvatarFallback>
                            </Avatar>
                            <span className={cn(
                                "absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-background transition-colors",
                                isOnline ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-muted-foreground/30"
                            )} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                                <h4 className="text-sm font-semibold truncate">
                                    {conv.name || otherUser?.name || 'Unknown'}
                                </h4>
                                {lastMsg && (
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                        {formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: false })}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                                {conv.typingUsers?.length > 0 ? (
                                    <span className="text-primary font-medium flex items-center gap-1">
                                        <span className="flex gap-0.5 mt-0.5">
                                            <motion.span
                                                animate={{ y: [0, -2, 0] }}
                                                transition={{ repeat: Infinity, duration: 0.5, delay: 0 }}
                                                className="h-1 w-1 bg-primary rounded-full"
                                            />
                                            <motion.span
                                                animate={{ y: [0, -2, 0] }}
                                                transition={{ repeat: Infinity, duration: 0.5, delay: 0.15 }}
                                                className="h-1 w-1 bg-primary/70 rounded-full"
                                            />
                                            <motion.span
                                                animate={{ y: [0, -2, 0] }}
                                                transition={{ repeat: Infinity, duration: 0.5, delay: 0.3 }}
                                                className="h-1 w-1 bg-primary/40 rounded-full"
                                            />
                                        </span>
                                        typing...
                                    </span>
                                ) : (
                                    lastMsg?.content || 'No messages yet'
                                )}
                            </p>
                        </div>
                        {conv.unreadCount > 0 && (
                            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                {conv.unreadCount}
                            </span>
                        )}
                    </Link>
                );
            })}
        </div>
    );
}
