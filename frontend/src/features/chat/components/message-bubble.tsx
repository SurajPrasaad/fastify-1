import React from 'react';
import { ChatMessage, ChatParticipant } from '@/types/chat';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';

interface MessageBubbleProps {
    message: ChatMessage;
    isMe: boolean;
    showAvatar: boolean;
    sender?: ChatParticipant;
}

export function MessageBubble({ message, isMe, showAvatar, sender }: MessageBubbleProps) {
    const statusIcons = {
        SENDING: <Clock className="h-3 w-3 animate-pulse" />,
        SENT: <Check className="h-3 w-3" />,
        DELIVERED: <CheckCheck className="h-3 w-3" />,
        READ: <CheckCheck className="h-3 w-3 text-sky-400" />,
        ERROR: <AlertCircle className="h-3 w-3 text-rose-500" />,
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={cn(
                "flex w-full gap-2 mb-1 px-4",
                isMe ? "justify-end pl-12" : "justify-start pr-12"
            )}
        >
            {/* Avatar Logic */}
            {!isMe && (
                <div className="w-8 shrink-0 flex items-end pb-1">
                    {showAvatar && (
                        <Avatar className="h-8 w-8 border border-white/5">
                            <AvatarImage src={sender?.avatarUrl} />
                            <AvatarFallback className="text-[10px] bg-[#6a7175]">
                                {sender?.name?.[0] || '?'}
                            </AvatarFallback>
                        </Avatar>
                    )}
                </div>
            )}

            <div className={cn(
                "group relative flex flex-col max-w-[85%]",
                isMe ? "items-end" : "items-start"
            )}>
                <div
                    className={cn(
                        "px-4 py-2.5 shadow-lg transition-all text-[15px] leading-relaxed break-words",
                        isMe
                            ? "bg-[#202c33] text-[#e9edef] rounded-[18px] rounded-tr-none border border-white/5"
                            : "bg-[#005c4b] text-[#e9edef] rounded-[18px] rounded-tl-none border border-white/5"
                    )}
                >
                    <p className="whitespace-pre-wrap">{message.content}</p>

                    <div className="flex items-center justify-end gap-1.5 mt-1 select-none">
                        <span className="text-[10px] text-[#8696a0] font-medium tabular-nums uppercase">
                            {format(new Date(message.createdAt), 'HH:mm')}
                        </span>
                        {isMe && (
                            <div className="flex shrink-0 opacity-80">
                                {statusIcons[message.status] || statusIcons.SENT}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
