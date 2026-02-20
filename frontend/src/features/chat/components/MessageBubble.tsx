
"use client";

import { IMessage } from '../types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/features/auth/components/AuthProvider';
import { Check, CheckCheck, Clock } from 'lucide-react';

interface MessageBubbleProps {
    message: IMessage;
    isGroup?: boolean;
}

export function MessageBubble({ message, isGroup }: MessageBubbleProps) {
    const { user } = useAuth();
    const isMe = message.senderId === user?.id;

    const renderStatus = () => {
        if (!isMe) return null;
        switch (message.status) {
            case 'sending': return <Clock className="h-3 w-3 animate-pulse" />;
            case 'sent': return <Check className="h-3 w-3 text-muted-foreground" />;
            case 'delivered': return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
            case 'read': return <CheckCheck className="h-3 w-3 text-primary" />;
            case 'error': return <span className="text-[10px] text-destructive">Failed</span>;
            default: return null;
        }
    };

    return (
        <div className={cn(
            "flex w-full mb-4",
            isMe ? "justify-end" : "justify-start"
        )}>
            <div className={cn(
                "flex flex-col max-w-[70%]",
                isMe ? "items-end" : "items-start"
            )}>
                {isGroup && !isMe && (
                    <span className="text-[10px] font-medium mb-1 ml-2 text-muted-foreground">
                        {message.sender?.name}
                    </span>
                )}

                <div className={cn(
                    "relative px-4 py-2 rounded-2xl text-sm shadow-sm",
                    isMe
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted text-foreground rounded-tl-none"
                )}>
                    {message.content}

                    <div className={cn(
                        "flex items-center gap-1 mt-1 justify-end",
                        isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                        <span className="text-[10px]">
                            {format(new Date(message.createdAt), 'HH:mm')}
                        </span>
                        {renderStatus()}
                    </div>
                </div>
            </div>
        </div>
    );
}
