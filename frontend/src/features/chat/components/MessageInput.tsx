
import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MessageInputProps {
    onSendMessage: (content: string) => void;
    onTyping: (isTyping: boolean) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
    onSendMessage,
    onTyping
}) => {
    const [content, setContent] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleSend = () => {
        if (!content.trim()) return;
        onSendMessage(content.trim());
        setContent('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);

        // Auto-resize
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;

        // Typing logic
        onTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => onTyping(false), 2000);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="p-4 bg-background/80 backdrop-blur-md border-t">
            <div className={cn(
                "flex items-end gap-2 max-w-6xl mx-auto rounded-2xl p-1.5 transition-all duration-200 border",
                isFocused ? "bg-card shadow-sm border-primary/30" : "bg-muted/50 border-transparent"
            )}>
                <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
                    <Smile className="w-6 h-6" />
                </button>

                <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
                    <Paperclip className="w-6 h-6" />
                </button>

                <textarea
                    ref={textareaRef}
                    rows={1}
                    value={content}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 text-[15px] max-h-[150px] scrollbar-none"
                />

                <AnimatePresence mode="popLayout">
                    {content.trim() ? (
                        <motion.button
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            onClick={handleSend}
                            className="p-2.5 bg-primary text-primary-foreground rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all"
                        >
                            <Send className="w-5 h-5 ml-0.5" />
                        </motion.button>
                    ) : (
                        <button className="p-2.5 text-muted-foreground hover:text-primary">
                            {/* Voice/Other button could go here */}
                        </button>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export const TypingIndicator: React.FC<{ users: string[] }> = ({ users }) => {
    if (users.length === 0) return null;

    return (
        <div className="px-4 py-1 text-[12px] text-muted-foreground italic flex items-center gap-2">
            <div className="flex gap-1">
                <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-1.5 h-1.5 bg-current rounded-full" />
                <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 bg-current rounded-full" />
                <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 bg-current rounded-full" />
            </div>
            <span>{users.length === 1 ? 'Someone is typing...' : 'Several people are typing...'}</span>
        </div>
    );
};
