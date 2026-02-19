import React, { useState, useRef, useCallback } from 'react';
import { Send, Smile, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MessageInputProps {
    onSendMessage: (content: string) => void;
    onTyping: (isTyping: boolean) => void;
}

export function MessageInput({ onSendMessage, onTyping }: MessageInputProps) {
    const [text, setText] = useState('');
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleSend = () => {
        if (!text.trim()) return;
        onSendMessage(text);
        setText('');
        onTyping(false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value);

        onTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            onTyping(false);
        }, 2000);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="p-4 bg-[#202c33]/90 backdrop-blur-xl border-t border-white/5">
            <div className="flex items-center gap-2 max-w-5xl mx-auto">
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="text-[#8696a0] hover:text-[#e9edef] hover:bg-white/5 shrink-0 h-10 w-10">
                        <Smile className="h-6 w-6" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-[#8696a0] hover:text-[#e9edef] hover:bg-white/5 shrink-0 h-10 w-10">
                        <Paperclip className="h-6 w-6" />
                    </Button>
                </div>

                <div className="flex-1">
                    <input
                        type="text"
                        value={text}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message"
                        className="w-full bg-[#2a3942] border-none focus:ring-1 focus:ring-white/10 rounded-xl py-2.5 px-5 text-[15px] text-[#e9edef] placeholder-[#8696a0] transition-all"
                    />
                </div>

                <div className="shrink-0 ml-1">
                    <Button
                        onClick={handleSend}
                        disabled={!text.trim()}
                        className={cn(
                            "rounded-full h-11 w-11 p-0 transition-all active:scale-90",
                            text.trim() ? "bg-[#00a884] hover:bg-[#008f72] text-white shadow-lg shadow-[#00a884]/20" : "bg-transparent text-[#8696a0]"
                        )}
                    >
                        <Send className={cn("h-5 w-5", text.trim() ? "fill-white/10" : "")} />
                    </Button>
                </div>
            </div>
        </div>
    );
}
