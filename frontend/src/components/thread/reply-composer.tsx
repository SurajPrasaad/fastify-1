"use client";

import * as React from "react";
import { Image as ImageIcon, Smile, List, MapPin, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface ReplyComposerProps {
    replyTo?: string;
    onReply?: (content: string) => void;
    isSubmitting?: boolean;
}

export function ReplyComposer({ replyTo, onReply, isSubmitting }: ReplyComposerProps) {
    const { user } = useAuth();
    const [content, setContent] = React.useState("");
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    const handleSubmit = () => {
        if (content.trim() && onReply) {
            onReply(content);
            setContent("");
            if (textareaRef.current) textareaRef.current.style.height = "auto";
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    if (!user) return null;

    const charLimit = 280;
    const isOverLimit = content.length > charLimit;
    const progress = Math.min((content.length / charLimit) * 100, 100);

    return (
        <div className="flex px-4 py-3 gap-3 bg-background border-b border-border/50 transition-all focus-within:bg-accent/5">
            <Avatar className="w-10 h-10 mt-1">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>

            <div className="flex-1 flex flex-col gap-2 min-w-0">
                {replyTo && (
                    <span className="text-sm text-muted-foreground">
                        Replying to <span className="text-primary hover:underline cursor-pointer">@{replyTo}</span>
                    </span>
                )}

                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Post your reply"
                    className="w-full bg-transparent border-none resize-none text-[20px] leading-relaxed placeholder:text-muted-foreground/60 focus:outline-none min-h-[44px] max-h-[600px] py-2"
                />

                <div className="flex items-center justify-between pt-2 border-t border-transparent">
                    <div className="flex items-center -ml-2 text-primary">
                        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 hover:bg-primary/10 transition-colors">
                            <ImageIcon className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 hover:bg-primary/10 transition-colors">
                            <Smile className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 hover:bg-primary/10 transition-colors">
                            <List className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 hover:bg-primary/10 transition-colors">
                            <MapPin className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-4">
                        {content.length > 0 && (
                            <div className="flex items-center gap-2">
                                <div className="relative w-7 h-7">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 32 32">
                                        <circle
                                            cx="16"
                                            cy="16"
                                            r="14"
                                            fill="transparent"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            className="text-border"
                                        />
                                        <motion.circle
                                            cx="16"
                                            cy="16"
                                            r="14"
                                            fill="transparent"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeDasharray={88}
                                            animate={{ strokeDashoffset: 88 - (88 * progress) / 100 }}
                                            className={cn(
                                                progress >= 100 ? "text-destructive" : progress > 80 ? "text-yellow-500" : "text-primary"
                                            )}
                                        />
                                    </svg>
                                </div>
                                {isOverLimit && (
                                    <span className="text-xs text-destructive font-medium">-{content.length - charLimit}</span>
                                )}
                            </div>
                        )}

                        <Button
                            size="sm"
                            onClick={handleSubmit}
                            disabled={!content.trim() || isSubmitting || isOverLimit}
                            className="rounded-full px-5 font-bold transition-all active:scale-95"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                "Reply"
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
