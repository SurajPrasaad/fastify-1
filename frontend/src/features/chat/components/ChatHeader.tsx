
import React from 'react';
import { MoreVertical, Phone, Video, Search, ChevronLeft } from 'lucide-react';
import { useChatStore } from '../store/chat.store';

export const ChatHeader: React.FC = () => {
    const activeId = useChatStore(state => state.activeConversationId);
    const conversation = useChatStore(state => activeId ? state.conversations[activeId] : null);
    const onlineUsers = useChatStore(state => state.onlineUsers);
    const setActiveConversation = useChatStore(state => state.setActiveConversation);

    if (!conversation) return null;

    const isOnline = conversation.participants.some(p => onlineUsers.has(p.id));

    return (
        <div className="h-16 border-b bg-background/80 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setActiveConversation(null)}
                    className="md:hidden p-2 hover:bg-muted rounded-full transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden">
                        {conversation.participants[0]?.avatarUrl ? (
                            <img src={conversation.participants[0].avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="w-full h-full flex items-center justify-center font-medium capitalize">
                                {(conversation.name || conversation.participants[0]?.name || '?')[0]}
                            </span>
                        )}
                    </div>
                    {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                    )}
                </div>

                <div>
                    <h3 className="font-semibold text-sm md:text-base leading-tight">
                        {conversation.name || conversation.participants[0]?.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                        {isOnline ? 'Active now' : 'Seen recently'}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-1 md:gap-3">
                <button className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-full transition-all hidden sm:block">
                    <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-full transition-all hidden sm:block">
                    <Video className="w-5 h-5" />
                </button>
                <button className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-full transition-all">
                    <Search className="w-5 h-5" />
                </button>
                <button className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-full transition-all">
                    <MoreVertical className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
