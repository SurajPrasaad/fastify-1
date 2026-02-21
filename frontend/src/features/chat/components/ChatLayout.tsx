
'use client';

import React, { useEffect } from 'react';
import { ConversationList } from './ConversationList';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput, TypingIndicator } from './MessageInput';
import { useChatStore } from '../store/chat.store';
import { useMessages } from '../hooks/useMessages';
import { useRealtimeChat } from '../hooks/useRealtimeChat';
import { ChatService } from '../services/chat.service';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ChatLayout: React.FC = () => {
    const activeConversationId = useChatStore(state => state.activeConversationId);
    const setConversations = useChatStore(state => state.setConversations);
    const sendMessage = useChatStore(state => state.sendMessage);

    // Real-time initialize
    const token = 'mock-token'; // Get from auth
    const { sendTypingStatus } = useRealtimeChat(token);

    const {
        messages,
        isFetchingMore,
        loadMoreMessages,
        hasMore
    } = useMessages(activeConversationId);

    const conversation = useChatStore(state =>
        activeConversationId ? state.conversations[activeConversationId] : null
    );

    useEffect(() => {
        // Initial load of conversations
        const fetch = async () => {
            const { data } = await ChatService.fetchConversations();
            setConversations(data);
        };
        fetch();
    }, [setConversations]);

    return (
        <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-background">
            {/* Sidebar - HIDDEN ON MOBILE IF CONVERSATION ACTIVE */}
            <div className={cn(
                "w-full md:w-[320px] lg:w-[400px] h-full flex-shrink-0 border-r",
                activeConversationId ? "hidden md:flex" : "flex"
            )}>
                <ConversationList />
            </div>

            {/* Main Chat Area */}
            <div className={cn(
                "flex-1 flex flex-col h-full bg-muted/20 relative",
                !activeConversationId ? "hidden md:flex items-center justify-center" : "flex"
            )}>
                <AnimatePresence mode="wait">
                    {activeConversationId ? (
                        <motion.div
                            key={activeConversationId}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col h-full w-full"
                        >
                            <ChatHeader />

                            <MessageList
                                messages={messages}
                                currentUserId="me" // Replace with actual user ID
                                isFetchingMore={isFetchingMore}
                                onLoadMore={loadMoreMessages}
                                hasMore={hasMore}
                            />

                            <TypingIndicator users={conversation?.typingUsers || []} />

                            <MessageInput
                                onSendMessage={(content) => sendMessage(activeConversationId, content)}
                                onTyping={(isTyping) => sendTypingStatus(activeConversationId, isTyping)}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-4 text-center p-8"
                        >
                            <div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center">
                                <MessageSquare className="w-10 h-10 text-primary opacity-40" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Your Messages</h3>
                                <p className="text-muted-foreground text-sm max-w-[240px]">
                                    Select a conversation from the list or start a new one to begin messaging.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
