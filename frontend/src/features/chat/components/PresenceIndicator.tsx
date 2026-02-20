
"use client";

import { useChatStore } from '../store/chat-store';
import { cn } from '@/lib/utils';

interface PresenceIndicatorProps {
    userId: string;
    className?: string;
    showLabel?: boolean;
}

export function PresenceIndicator({ userId, className, showLabel }: PresenceIndicatorProps) {
    const presence = useChatStore(state => state.presenceMap[userId]);

    const isOnline = presence?.status === 'ONLINE';

    return (
        <div className={cn("flex items-center gap-1.5", className)}>
            <div className={cn(
                "relative flex h-2.5 w-2.5",
                isOnline ? "text-green-500" : "text-muted-foreground/50"
            )}>
                {isOnline && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                )}
                <span className={cn(
                    "relative inline-flex rounded-full h-2.5 w-2.5 bg-current border-2 border-background"
                )}></span>
            </div>
            {showLabel && (
                <span className="text-[11px] font-medium text-muted-foreground">
                    {isOnline ? 'Online' : 'Offline'}
                </span>
            )}
        </div>
    );
}
