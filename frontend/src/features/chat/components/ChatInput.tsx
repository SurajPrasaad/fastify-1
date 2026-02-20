
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Smile, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatInputProps {
    onSendMessage: (content: string) => void;
    onTyping: () => void;
    onStopTyping: () => void;
}

export function ChatInput({ onSendMessage, onTyping, onStopTyping }: ChatInputProps) {
    const [content, setContent] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!content.trim()) return;

        onSendMessage(content.trim());
        setContent('');
        setIsTyping(false);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            onStopTyping();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);

        if (!typingTimeoutRef.current) {
            onTyping();
            setIsTyping(true);
        } else {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            onStopTyping();
            setIsTyping(false);
            typingTimeoutRef.current = null;
        }, 2000);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <form onSubmit={handleSend} className="p-4 border-t bg-card/30 backdrop-blur-md">
            <div className="flex items-end gap-2 max-w-4xl mx-auto">
                <Button type="button" variant="ghost" size="icon" className="shrink-0 h-10 w-10">
                    <Paperclip className="h-5 w-5" />
                </Button>

                <div className="flex-1 relative bg-background rounded-xl border focus-within:ring-1 focus-within:ring-primary/50 transition-all">
                    <textarea
                        rows={1}
                        value={content}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="w-full bg-transparent border-none focus:ring-0 resize-none py-2.5 px-3 text-sm min-h-[40px] max-h-32"
                    />
                    {isTyping && (
                        <div className="absolute -top-6 left-2 flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-1 duration-200">
                            <div className="flex gap-0.5 mt-0.5">
                                <motion.span
                                    animate={{ y: [0, -2, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.5, delay: 0 }}
                                    className="h-1 w-1 bg-primary rounded-full"
                                />
                                <motion.span
                                    animate={{ y: [0, -2, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.5, delay: 0.15 }}
                                    className="h-1 w-1 bg-primary/70 rounded-full"
                                />
                                <motion.span
                                    animate={{ y: [0, -2, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.5, delay: 0.3 }}
                                    className="h-1 w-1 bg-primary/40 rounded-full"
                                />
                            </div>
                            <span className="text-[10px] text-primary font-medium tracking-tight">You are typing...</span>
                        </div>
                    )}
                    <div className="absolute right-2 bottom-1.5 flex items-center gap-1">
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                            <Smile className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                            <ImageIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={!content.trim()}
                    className="shrink-0 h-10 w-10 rounded-xl"
                >
                    <Send className="h-5 w-5" />
                </Button>
            </div>
        </form>
    );
}
