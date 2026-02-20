
"use client";

import { useEffect } from 'react';
import { useChatStore } from '../store/chat-store';
import { socketManager } from '../sockets/socket-manager';
import { useAuth } from '@/features/auth/components/AuthProvider';
import { ConversationList } from './ConversationList';
import { api } from '@/lib/api-client';

interface ChatLayoutProps {
    children: React.ReactNode;
}

export function ChatLayout({ children }: ChatLayoutProps) {
    const { user } = useAuth();
    const loadConversations = useChatStore(state => state.loadConversations);

    useEffect(() => {
        const token = api.getToken();
        if (token) {
            socketManager.connect(token);
            loadConversations();
        }
        return () => socketManager.disconnect();
    }, [loadConversations]);

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
            <aside className="w-80 border-r flex flex-col bg-card/50">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold">Messages</h2>
                    <div className="mt-2">
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            className="w-full px-3 py-1.5 text-sm rounded-lg border bg-background"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <ConversationList />
                </div>
            </aside>
            <main className="flex-1 flex flex-col relative bg-background">
                {children}
            </main>
        </div>
    );
}
