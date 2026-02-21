
import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { IMessage } from '../types/chat.types';
import { MessageBubble } from './MessageBubble';
import { format, isSameDay } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageListProps {
    messages: IMessage[];
    currentUserId: string;
    isFetchingMore: boolean;
    onLoadMore: () => void;
    hasMore: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
    messages,
    currentUserId,
    isFetchingMore,
    onLoadMore,
    hasMore
}) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);

    // Group messages by date and sender
    const flatItems = useMemo(() => {
        const items: any[] = [];
        messages.forEach((msg, index) => {
            const prevMsg = messages[index - 1];

            // Add date separator
            if (!prevMsg || !isSameDay(new Date(msg.createdAt), new Date(prevMsg.createdAt))) {
                items.push({ type: 'date', date: msg.createdAt });
            }

            const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId ||
                !isSameDay(new Date(msg.createdAt), new Date(prevMsg.createdAt));

            items.push({ type: 'message', message: msg, showAvatar });
        });
        return items;
    }, [messages]);

    const virtualizer = useVirtualizer({
        count: flatItems.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 60,
        overscan: 5,
    });

    // Auto scroll logic
    useEffect(() => {
        if (messages.length > 0 && !isFetchingMore) {
            virtualizer.scrollToIndex(flatItems.length - 1, { align: 'end' });
        }
    }, [messages.length, isFetchingMore, virtualizer, flatItems.length]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const isNearTop = target.scrollTop < 100;
        const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 200;

        if (isNearTop && hasMore && !isFetchingMore) {
            onLoadMore();
        }

        setShowScrollToBottom(!isNearBottom);
    };

    return (
        <div
            ref={parentRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 scroll-smooth bg-chat-pattern" // Pattern can be added via CSS
        >
            {isFetchingMore && (
                <div className="flex justify-center py-2">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
            )}

            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                    const item = flatItems[virtualRow.index];

                    return (
                        <div
                            key={virtualRow.key}
                            data-index={virtualRow.index}
                            ref={virtualizer.measureElement}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                            className="py-1"
                        >
                            {item.type === 'date' ? (
                                <div className="flex justify-center my-4 sticky top-0 z-20">
                                    <span className="px-3 py-1 bg-background/80 backdrop-blur-sm border rounded-full text-[11px] font-medium text-muted-foreground shadow-sm">
                                        {format(new Date(item.date), 'MMMM d, yyyy')}
                                    </span>
                                </div>
                            ) : (
                                <MessageBubble
                                    message={item.message}
                                    isMe={item.message.senderId === currentUserId}
                                    showAvatar={item.showAvatar}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            <AnimatePresence>
                {showScrollToBottom && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        onClick={() => virtualizer.scrollToIndex(flatItems.length - 1, { align: 'end' })}
                        className="fixed bottom-24 right-8 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 active:scale-95 transition-transform z-30"
                    >
                        <svg className="w-5 h-5 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 19V5M5 12l7-7 7 7" />
                        </svg>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};
