
"use client";

import { useChatStore } from '@/features/chat/store/chat-store';
import { MessageSquare } from 'lucide-react';

export default function ChatPage() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-card/5">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
                <MessageSquare className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Select a Conversation</h1>
            <p className="text-muted-foreground max-w-sm">
                Choose a chat from the left sidebar to start messaging your friends or group.
            </p>
        </div>
    );
}
