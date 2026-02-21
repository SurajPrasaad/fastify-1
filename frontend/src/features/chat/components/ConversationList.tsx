
import React from 'react';
import { useChatStore } from '../store/chat.store';
import { IConversation } from '../types/chat.types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export const ConversationItem: React.FC<{ conversation: IConversation; isActive: boolean }> = ({
    conversation,
    isActive
}) => {
    const setActiveConversation = useChatStore(state => state.setActiveConversation);
    const onlineUsers = useChatStore(state => state.onlineUsers);
    const isOnline = conversation.participants.some(p => onlineUsers.has(p.id));

    return (
        <div
            onClick={() => setActiveConversation(conversation.id)}
            className={cn(
                "flex items-center gap-3 p-3 cursor-pointer transition-all duration-200 rounded-xl mx-2",
                isActive
                    ? "bg-primary/10 border-primary/20"
                    : "hover:bg-muted/50 border-transparent"
            )}
        >
            <div className="relative">
                <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden">
                    {conversation.participants[0]?.avatarUrl ? (
                        <img src={conversation.participants[0].avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <span className="w-full h-full flex items-center justify-center text-lg uppercase font-medium">
                            {(conversation.name || conversation.participants[0]?.name || '?')[0]}
                        </span>
                    )}
                </div>
                {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                    <h4 className="font-semibold text-[15px] truncate max-w-[140px]">
                        {conversation.name || conversation.participants[0]?.name}
                    </h4>
                    {conversation.lastMessage && (
                        <span className="text-[11px] text-muted-foreground">
                            {format(new Date(conversation.lastMessage.createdAt), 'HH:mm')}
                        </span>
                    )}
                </div>

                <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground truncate opacity-80">
                        {conversation.typingUsers.length > 0
                            ? <span className="text-primary font-medium animate-pulse">Typing...</span>
                            : conversation.lastMessage?.content || 'No messages yet'}
                    </p>
                    {conversation.unreadCount > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 bg-primary text-[10px] font-bold text-primary-foreground rounded-full flex items-center justify-center">
                            {conversation.unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export const ConversationList: React.FC = () => {
    const conversations = useChatStore(state => Object.values(state.conversations));
    const activeId = useChatStore(state => state.activeConversationId);

    return (
        <div className="flex flex-col h-full bg-card/50 backdrop-blur-sm border-r">
            <div className="p-4 border-b">
                <h2 className="text-xl font-bold tracking-tight">Messages</h2>
                {/* Search bar could go here */}
            </div>
            <div className="flex-1 overflow-y-auto py-2 scrollbar-none">
                {conversations.length === 0 ? (
                    <div className="text-center py-10 opacity-50 space-y-2">
                        <p className="text-sm">No conversations found</p>
                    </div>
                ) : (
                    conversations.sort((a, b) =>
                        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                    ).map(conv => (
                        <ConversationItem
                            key={conv.id}
                            conversation={conv}
                            isActive={conv.id === activeId}
                        />
                    ))
                )}
            </div>
        </div>
    );
};
