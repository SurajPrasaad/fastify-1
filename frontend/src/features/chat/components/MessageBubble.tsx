
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import { IMessage, MessageStatus, MessageType } from '../types/chat.types';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
    message: IMessage;
    isMe: boolean;
    showAvatar?: boolean;
    showTail?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    isMe,
    showAvatar,
    showTail = true
}) => {
    const statusIcon = useMemo(() => {
        switch (message.status) {
            case MessageStatus.SENDING:
                return <Check className="w-3 h-3 text-muted-foreground opacity-50" />;
            case MessageStatus.SENT:
                return <Check className="w-3 h-3 text-muted-foreground" />;
            case MessageStatus.DELIVERED:
                return <CheckCheck className="w-3 h-3 text-muted-foreground" />;
            case MessageStatus.READ:
                return <CheckCheck className="w-3 h-3 text-blue-500" />;
            case MessageStatus.ERROR:
                return <span className="text-[10px] text-destructive">Failed</span>;
            default:
                return null;
        }
    }, [message.status]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            layout
            className={cn(
                "flex w-full mb-1 group",
                isMe ? "justify-end" : "justify-start"
            )}
        >
            <div className={cn(
                "flex max-w-[80%] md:max-w-[70%] items-end gap-1",
                isMe ? "flex-row-reverse" : "flex-row"
            )}>
                {/* Avatar Placeholder/Icon if needed */}
                {!isMe && showAvatar && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex-shrink-0 mb-1 overflow-hidden">
                        {message.sender.avatarUrl ? (
                            <img src={message.sender.avatarUrl} alt={message.sender.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xs flex items-center justify-center h-full">
                                {message.sender.name[0]}
                            </span>
                        )}
                    </div>
                )}

                <div className="flex flex-col relative">
                    <div
                        className={cn(
                            "relative px-4 py-2.5 shadow-sm transition-all duration-200",
                            "hover:brightness-95 active:scale-[0.99] cursor-pointer",
                            isMe
                                ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                                : "bg-card text-card-foreground border rounded-2xl rounded-tl-sm",
                            !showTail && (isMe ? "rounded-tr-2xl" : "rounded-tl-2xl")
                        )}
                    >
                        {/* Reply Preview */}
                        {message.replyTo && (
                            <div className={cn(
                                "mb-2 p-2 rounded-lg text-xs border-l-4 overflow-hidden",
                                isMe ? "bg-primary-foreground/10 border-primary-foreground/30" : "bg-muted border-primary"
                            )}>
                                <p className="font-bold opacity-80">{message.replyTo.senderName}</p>
                                <p className="line-clamp-1 opacity-70 italic">{message.replyTo.content}</p>
                            </div>
                        )}

                        {/* Message Content */}
                        <div className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                            {message.content}
                        </div>

                        {/* Meta Info */}
                        <div className={cn(
                            "flex items-center justify-end gap-1 mt-1 -mr-1 h-3",
                            isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                            <span className="text-[10px]">
                                {format(new Date(message.createdAt), 'HH:mm')}
                            </span>
                            {isMe && <div className="ml-0.5">{statusIcon}</div>}
                        </div>

                        {/* Edited Label */}
                        {message.isEdited && (
                            <span className="absolute -bottom-4 right-0 text-[10px] text-muted-foreground italic">
                                edited
                            </span>
                        )}
                    </div>

                    {/* Reactions */}
                    <AnimatePresence>
                        {message.reactions && message.reactions.length > 0 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex gap-1 mt-1 -translate-y-2 z-10"
                            >
                                {message.reactions.map((r, i) => (
                                    <button
                                        key={i}
                                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-background border text-[11px] hover:bg-muted"
                                    >
                                        <span>{r.emoji}</span>
                                        <span className="font-medium">{r.count}</span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};
