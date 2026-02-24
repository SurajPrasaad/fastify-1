"use client";

import * as React from "react";
import { Smile, Image as ImageIcon, List, MapPin, Loader2, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/stores/auth.store";

interface ReplyComposerProps {
    replyTo?: string;
    onReply: (content: string) => void;
    isSubmitting?: boolean;
    placeholder?: string;
}

export function ReplyComposer({ replyTo, onReply, isSubmitting, placeholder = "Post your reply" }: ReplyComposerProps) {
    const { user } = useAuthStore();
    const [content, setContent] = React.useState("");
    const [isFocused, setIsFocused] = React.useState(false);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        const target = e.target as HTMLTextAreaElement;
        target.style.height = "auto";
        target.style.height = `${target.scrollHeight}px`;
        setContent(target.value);
    };

    const handleSubmit = () => {
        if (!content.trim() || isSubmitting) return;
        onReply(content);
        setContent("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
    };

    return (
        <div className={cn(
            "p-4 border-b border-border/50 transition-all duration-300",
            isFocused ? "bg-background" : "bg-background/50"
        )}>
            {isFocused && replyTo && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex items-center gap-2 mb-3 ml-12 text-sm text-muted-foreground"
                >
                    <span>Replying to</span>
                    <span className="text-blue-500 font-medium">@{replyTo}</span>
                </motion.div>
            )}

            <div className="flex gap-3">
                <Avatar className="w-10 h-10 border border-border/50">
                    <AvatarImage src={user?.avatarUrl || undefined} alt={user?.username || "user"} />
                    <AvatarFallback>{user?.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 space-y-3">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onInput={handleInput}
                        onFocus={() => setIsFocused(true)}
                        placeholder={placeholder}
                        className="w-full bg-transparent border-none focus:ring-0 text-[18px] md:text-[20px] resize-none py-1.5 placeholder:text-muted-foreground/60 leading-normal"
                    />

                    <AnimatePresence>
                        {isFocused || content.length > 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-between pt-2 border-t border-border/50"
                            >
                                <div className="flex items-center -ml-2 text-blue-500">
                                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-500/10">
                                        <ImageIcon className="w-[18px] h-[18px]" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-500/10">
                                        <Smile className="w-[18px] h-[18px]" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-500/10">
                                        <List className="w-[18px] h-[18px]" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-500/10">
                                        <MapPin className="w-[18px] h-[18px]" />
                                    </Button>
                                </div>

                                <div className="flex items-center gap-4">
                                    {content.length > 0 && (
                                        <div className="relative w-7 h-7 flex items-center justify-center">
                                            <svg className="w-full h-full -rotate-90">
                                                <circle
                                                    cx="14"
                                                    cy="14"
                                                    r="12"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    className="text-muted-foreground/20"
                                                />
                                                <circle
                                                    cx="14"
                                                    cy="14"
                                                    r="12"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeDasharray={75.4}
                                                    strokeDashoffset={75.4 - (Math.min(content.length, 280) / 280) * 75.4}
                                                    className={cn(
                                                        "transition-all",
                                                        content.length > 260 ? "text-orange-500" : "text-blue-500",
                                                        content.length > 280 && "text-red-500"
                                                    )}
                                                />
                                            </svg>
                                            {content.length > 260 && (
                                                <span className="absolute text-[10px] font-medium">
                                                    {280 - content.length}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleSubmit}
                                        disabled={!content.trim() || content.length > 280 || isSubmitting}
                                        className="rounded-full px-5 font-bold transition-all disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            "Reply"
                                        )}
                                    </Button>
                                </div>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
