"use client";

import * as React from "react";
import { Heart, MessageCircle, Repeat2, Share2, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface Reply {
    id: string;
    author: {
        username: string;
        displayName: string;
        avatarUrl?: string;
    };
    content: string;
    stats: {
        likes: number;
        comments: number;
    };
    createdAt: Date;
    isLiked?: boolean;
    replyTo?: string;
    replies?: Reply[];
}

interface ReplyItemProps {
    reply: Reply;
    isLast?: boolean;
    isNested?: boolean;
    hasConnector?: boolean;
}

export function ReplyItem({ reply, isLast, isNested, hasConnector }: ReplyItemProps) {
    const [isLiked, setIsLiked] = React.useState(reply.isLiked);
    const [likesCount, setLikesCount] = React.useState(reply.stats.likes);

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsLiked(!isLiked);
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "relative flex gap-3 px-4 py-3 bg-background hover:bg-neutral-900/40 transition-colors cursor-pointer group",
                isNested && "pl-14 sm:pl-16"
            )}
        >
            {/* Thread Connector Line */}
            {hasConnector && !isLast && (
                <div className="absolute left-[39px] top-12 bottom-0 w-[2px] bg-border/60" aria-hidden="true" />
            )}

            <div className="relative flex flex-col items-center flex-shrink-0">
                <Avatar className="w-10 h-10 ring-2 ring-background">
                    <AvatarImage src={reply.author.avatarUrl} alt={reply.author.username} />
                    <AvatarFallback>{reply.author.displayName[0]}</AvatarFallback>
                </Avatar>
            </div>

            <div className="flex-1 min-w-0 space-y-1">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-1.5 text-[15px]">
                        <span className="font-bold hover:underline">{reply.author.displayName}</span>
                        <span className="text-muted-foreground whitespace-nowrap">@{reply.author.username}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground hover:underline whitespace-nowrap">
                            {formatDistanceToNow(reply.createdAt).replace('about ', '').replace(' minutes', 'm').replace(' hours', 'h').replace(' days', 'd')}
                        </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 rounded-full text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                    </Button>
                </div>

                {/* Reply To info */}
                {reply.replyTo && (
                    <p className="text-sm text-muted-foreground">
                        Replying to <span className="text-primary hover:underline">@{reply.replyTo}</span>
                    </p>
                )}

                {/* Content */}
                <p className="text-[15px] leading-normal break-words whitespace-pre-wrap">
                    {reply.content}
                </p>

                {/* Engagement Row */}
                <div className="flex justify-between items-center max-w-[425px] pt-1 -ml-2">
                    <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors group/btn">
                        <div className="p-2 rounded-full group-hover/btn:bg-primary/10 transition-colors">
                            <MessageCircle className="w-4.5 h-4.5" />
                        </div>
                        <span className="text-xs">{reply.stats.comments || ''}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-muted-foreground hover:text-green-500 transition-colors group/btn">
                        <div className="p-2 rounded-full group-hover/btn:bg-green-500/10 transition-colors">
                            <Repeat2 className="w-4.5 h-4.5" />
                        </div>
                    </button>
                    <button
                        onClick={handleLike}
                        className={cn(
                            "flex items-center gap-1.5 transition-colors group/btn",
                            isLiked ? "text-pink-500" : "text-muted-foreground hover:text-pink-500"
                        )}
                    >
                        <div className="p-2 rounded-full group-hover/btn:bg-pink-500/10 transition-colors">
                            <Heart className={cn("w-4.5 h-4.5", isLiked && "fill-current")} />
                        </div>
                        <span className="text-xs">{likesCount || ''}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-muted-foreground hover:text-blue-500 transition-colors group/btn">
                        <div className="p-2 rounded-full group-hover/btn:bg-blue-500/10 transition-colors">
                            <Share2 className="w-4.5 h-4.5" />
                        </div>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
