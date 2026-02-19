"use client";

import React from 'react';
import { useChatMessages } from '../hooks/use-chat-messages';
import { useChatSocket } from '../hooks/use-chat-socket';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TypingIndicator } from './typing-indicator';

interface ChatWindowProps {
    roomId: string;
    currentUserId: string;
    recipientName?: string;
}

export function ChatWindow({ roomId, currentUserId, recipientName }: ChatWindowProps) {
    const {
        data: history,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useChatMessages(roomId);

    const {
        isConnected,
        sendMessage,
        sendTyping,
        typingUsers
    } = useChatSocket({ roomId });

    const messages = history?.pages.flatMap(page => page.data) || [];

    return (
        <div className="flex flex-col h-[750px] w-full max-w-4xl mx-auto bg-[#0b141a] rounded-2xl overflow-hidden border border-white/5 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]">
            {/* Header */}
            <div className="px-6 py-3 border-b border-white/5 bg-[#202c33]/95 backdrop-blur-xl flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#6a7175] flex items-center justify-center text-white/50 text-xl font-bold shadow-inner">
                        {recipientName?.[0] || '?'}
                    </div>
                    <div>
                        <h3 className="font-semibold text-[15px] text-[#e9edef] leading-tight">
                            {recipientName || 'Select Chat'}
                        </h3>
                        {isConnected && (
                            <p className="text-[12px] text-[#8696a0] mt-0.5">
                                {typingUsers.length > 0 ? (
                                    <span className="text-[#00a884] font-medium lowercase tracking-wide">typing...</span>
                                ) : (
                                    'online'
                                )}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 text-[#8696a0]">
                    <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-black border transition-all",
                        isConnected ? "border-[#00a884]/20 bg-[#00a884]/5 text-[#00a884]" : "border-amber-500/20 bg-amber-500/5 text-amber-500 animate-pulse"
                    )}>
                        <div className={cn("h-1.5 w-1.5 rounded-full", isConnected ? "bg-[#00a884]" : "bg-amber-500")} />
                        {isConnected ? 'End-to-End Encrypted' : 'Establishing Secure Link'}
                    </div>
                </div>
            </div>

            {/* Chat Content */}
            <div className="flex-1 flex flex-col min-h-0 relative">
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="h-12 w-12 animate-spin text-[#00a884]/30" />
                    </div>
                ) : (
                    <>
                        <MessageList messages={messages} currentUserId={currentUserId} />

                        {/* Interactive Typing Overlay */}
                        {typingUsers.length > 0 && (
                            <div className="absolute bottom-6 left-6 z-20 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <TypingIndicator />
                            </div>
                        )}

                        {hasNextPage && (
                            <div className="absolute top-0 left-0 right-0 p-2 flex justify-center z-10">
                                <button
                                    onClick={() => fetchNextPage()}
                                    disabled={isFetchingNextPage}
                                    className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8696a0] hover:text-[#e9edef] bg-[#202c33]/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/5 transition-all active:scale-95"
                                >
                                    {isFetchingNextPage ? 'Decoding payload...' : 'Load History'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Input Area */}
            <MessageInput
                onSendMessage={(content) => sendMessage(content)}
                onTyping={(isTyping) => sendTyping(isTyping)}
            />
        </div>
    );
}
