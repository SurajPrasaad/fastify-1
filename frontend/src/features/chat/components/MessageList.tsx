
"use client";

import { useEffect, useRef, useState, useMemo } from 'react';
import { useChat } from '../hooks/useChat';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { useInView } from 'react-intersection-observer';
import { Loader2, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/features/auth/components/AuthProvider';
import { TypingIndicator } from './typing-indicator';

interface MessageListProps {
    roomId: string;
}

export function MessageList({ roomId }: MessageListProps) {
    const { user } = useAuth();
    const { messages, activeConversation, sendMessage, sendTyping, stopTyping, loadHistory, isLoading } = useChat(roomId);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);

    // Infinite Load Observer
    const { ref: topRef, inView: topInView } = useInView({ threshold: 0 });

    const loadMore = async () => {
        if (messages.length > 0 && !isLoading.messages) {
            const firstMessageId = messages[0].id; // or timestamp
            await loadHistory(firstMessageId);
        }
    };

    useEffect(() => {
        if (topInView) {
            loadMore();
        }
    }, [topInView]);

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior
            });
        }
    };

    // Auto-scroll on new message
    useEffect(() => {
        const isNearBottom = scrollRef.current
            ? scrollRef.current.scrollHeight - scrollRef.current.scrollTop - scrollRef.current.clientHeight < 200
            : true;

        if (isNearBottom) {
            scrollToBottom('auto');
        } else if (messages.length > 0) {
            setShowScrollButton(true);
        }
    }, [messages]);

    // Initial load scroll
    useEffect(() => {
        if (!isLoading.messages && messages.length > 0) {
            scrollToBottom('auto');
        }
    }, [roomId, isLoading.messages]);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        setShowScrollButton(scrollHeight - scrollTop - clientHeight > 300);
    };

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* Messages Area */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin overflow-x-hidden"
            >
                {/* Top Sentinel for Pagination */}
                <div ref={topRef} className="h-1 w-full" />

                {isLoading.messages && messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto">
                        {messages.map((msg, index) => (
                            <MessageBubble
                                key={msg.id}
                                message={msg}
                                isGroup={activeConversation?.type === 'GROUP'}
                            />
                        ))}
                    </div>
                )}

                {/* Typing Indicator */}
                {(() => {
                    const otherTypingUsers = (activeConversation?.typingUsers || [])
                        .filter(id => id !== user?.id)
                        .map(id => activeConversation?.participants.find(p => p.id === id))
                        .filter(Boolean);

                    if (otherTypingUsers.length === 0) return null;

                    return (
                        <div className="max-w-4xl mx-auto px-4 mb-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex flex-col items-start gap-1">
                                <div className="flex items-end gap-2">
                                    {otherTypingUsers.length === 1 && otherTypingUsers[0]?.avatarUrl && (
                                        <Avatar className="h-6 w-6 border shadow-sm">
                                            <AvatarImage src={otherTypingUsers[0].avatarUrl} />
                                            <AvatarFallback className="text-[10px]">{otherTypingUsers[0].name?.[0]}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <TypingIndicator />
                                </div>
                                <span className="text-[10px] text-muted-foreground ml-1 font-medium tracking-tight">
                                    {otherTypingUsers.length === 1
                                        ? `${otherTypingUsers[0]?.username || otherTypingUsers[0]?.name} is typing...`
                                        : `${otherTypingUsers.length} people are typing...`}
                                </span>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Floating Action: Scroll to Bottom */}
            {showScrollButton && (
                <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-24 right-8 rounded-full shadow-lg animate-bounce"
                    onClick={() => scrollToBottom()}
                >
                    <ArrowDown className="h-5 w-5" />
                </Button>
            )}


            {/* Chat Input Area */}
            <ChatInput
                onSendMessage={sendMessage}
                onTyping={sendTyping}
                onStopTyping={stopTyping}
            />
        </div>
    );
}
