
"use client";

import { useParams } from 'next/navigation';
import { MessageList } from '@/features/chat/components/MessageList';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChat } from '@/features/chat/hooks/useChat';
import { Phone, Video, Info, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/components/AuthProvider';

export default function ChatRoomPage() {
    const { roomId } = useParams<{ roomId: string }>();
    const { user } = useAuth();
    const { activeConversation, presenceMap } = useChat(roomId);

    // Assuming DIRECT for title logic
    const otherUser = activeConversation?.participants.find(p => p.id !== user?.id);
    const isTyping = activeConversation?.typingUsers?.some(uid => uid !== user?.id);
    const isOnline = otherUser ? presenceMap[otherUser.id]?.status === 'ONLINE' : false;

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Chat Header */}
            <header className="h-16 border-b px-4 flex items-center justify-between bg-card/10 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={otherUser?.avatarUrl} />
                        <AvatarFallback>{otherUser?.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <h3 className="text-sm font-bold leading-none">
                            {activeConversation?.name || otherUser?.name || 'Loading...'}
                        </h3>
                        {isTyping ? (
                            <span className="text-[11px] text-primary font-medium animate-pulse">typing...</span>
                        ) : isOnline ? (
                            <span className="text-[11px] text-green-500 font-medium">Online</span>
                        ) : (
                            <span className="text-[11px] text-muted-foreground font-medium">Offline</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                        <Phone className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                        <Video className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                        <Info className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                        <MoreVertical className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            {/* Messages Component */}
            <MessageList roomId={roomId} />
        </div>
    );
}
