import React, { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { format, isSameDay } from 'date-fns';
import { ChatMessage } from '@/types/chat';
import { MessageBubble } from './message-bubble';

interface MessageListProps {
    messages: ChatMessage[];
    currentUserId: string;
    onRetry?: (tempId: string) => void;
}

export function MessageList({ messages, currentUserId, onRetry }: MessageListProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const reversedMessages = [...messages].reverse();

    return (
        <div className="flex-1 overflow-y-auto pt-4 pb-2 no-scrollbar bg-[#0b141a]/50">
            <AnimatePresence mode="popLayout" initial={false}>
                {reversedMessages.map((msg, index) => {
                    const isMe = msg.senderId === currentUserId;
                    const prevMsg = index > 0 ? reversedMessages[index - 1] : null;
                    const nextMsg = index < reversedMessages.length - 1 ? reversedMessages[index + 1] : null;

                    // Grouping Logic:
                    // Show avatar if:
                    // 1. It's a received message AND
                    // 2. It's the first message from this sender in a sequence OR it's a new day
                    const isNewDay = !prevMsg || !isSameDay(new Date(msg.createdAt), new Date(prevMsg.createdAt));
                    const isFirstInSequence = !prevMsg || prevMsg.senderId !== msg.senderId || isNewDay;

                    // Extra spacing logic
                    const isLastInSequence = !nextMsg || nextMsg.senderId !== msg.senderId;

                    return (
                        <React.Fragment key={msg._id}>
                            {isNewDay && (
                                <div className="flex justify-center my-6 sticky top-2 z-10">
                                    <span className="bg-[#182229] text-[#8696a0] text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-white/5 shadow-sm">
                                        {format(new Date(msg.createdAt), 'MMMM d, yyyy')}
                                    </span>
                                </div>
                            )}
                            <MessageBubble
                                message={msg}
                                isMe={isMe}
                                showAvatar={!isMe && isFirstInSequence}
                                sender={undefined} // In a real app, find sender object from room participants
                                onRetry={onRetry}
                            />
                            {isLastInSequence && <div className="h-2" />}
                        </React.Fragment>
                    );
                })}
            </AnimatePresence>
            <div ref={bottomRef} className="h-4" />
        </div>
    );
}
