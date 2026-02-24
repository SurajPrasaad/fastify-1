"use client";

import * as React from "react";
import {
    Heart,
    MessageCircle,
    Repeat2,
    Share2,
    MoreHorizontal,
    Trash2,
    Flag,
    Edit3,
    Pin,
    Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useToggleLike, useCreateComment } from "@/features/interaction/hooks";
import { commentApi } from "@/features/comments/api";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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
    isPinned?: boolean;
    replies?: Reply[];
}

interface ReplyItemProps {
    reply: Reply;
    postId: string;
    isLast?: boolean;
    isNested?: boolean;
    hasConnector?: boolean;
    level?: number;
    parentAuthorUsername?: string;
}

export function ReplyItem({
    reply,
    postId,
    isLast,
    isNested,
    hasConnector,
    level = 0,
    parentAuthorUsername
}: ReplyItemProps) {
    const { isLiked, count: likesCount, toggleLike } = useToggleLike(reply.isLiked || false, reply.stats.likes);
    const { createComment, isSubmitting } = useCreateComment();

    const [isHovered, setIsHovered] = React.useState(false);
    const [showReplies, setShowReplies] = React.useState(false);
    const [childReplies, setChildReplies] = React.useState<any[]>([]);
    const [isLoadingReplies, setIsLoadingReplies] = React.useState(false);
    const [isReplyOpen, setIsReplyOpen] = React.useState(false);
    const [replyContent, setReplyContent] = React.useState("");

    const handleLike = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        toggleLike(reply.id, "COMMENT");
    };

    const handleFetchReplies = async () => {
        if (showReplies) {
            setShowReplies(false);
            return;
        }

        setShowReplies(true);
        if (childReplies.length > 0) return;

        setIsLoadingReplies(true);
        try {
            const data = await commentApi.getCommentReplies(postId, reply.id);
            setChildReplies(data);
        } catch (error) {
            setShowReplies(false);
        } finally {
            setIsLoadingReplies(false);
        }
    };

    const handleReplySubmit = async () => {
        if (!replyContent.trim()) return;
        await createComment(postId, replyContent, reply.id, (newReply) => {
            setChildReplies(prev => [newReply, ...prev]);
            setReplyContent("");
            setIsReplyOpen(false);
            setShowReplies(true);
            // In a real app we might update the reply.stats.comments locally too
        });
    };

    const renderContent = (content: string) => {
        return content.split(/(\s+)/).map((part, i) => {
            if (part.startsWith("@")) {
                return <span key={i} className="text-blue-500 hover:underline cursor-pointer">{part}</span>;
            }
            if (part.startsWith("#")) {
                return <span key={i} className="text-blue-500 hover:underline cursor-pointer">{part}</span>;
            }
            return part;
        });
    };

    return (
        <div className="flex flex-col">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={cn(
                    "relative flex gap-3 px-4 py-4 transition-all duration-200 group/item",
                    level > 0 ? "pl-12 sm:pl-16 bg-neutral-50/30 dark:bg-white/[0.02]" : "bg-background",
                    "hover:bg-neutral-100/50 dark:hover:bg-white/[0.04]"
                )}
            >
                {/* Thread Connector Line */}
                {(hasConnector || (showReplies && childReplies.length > 0)) && (
                    <div
                        className={cn(
                            "absolute left-[39px] w-[2px] bg-neutral-200 dark:bg-neutral-800 z-0",
                            level > 0 ? "top-0 bottom-0 left-[35px] sm:left-[43px]" : "top-14 bottom-0"
                        )}
                        aria-hidden="true"
                    />
                )}

                {/* Avatar */}
                <div className="relative flex flex-col items-center flex-shrink-0 z-10">
                    <Avatar className={cn(
                        "transition-transform duration-200 group-hover/item:scale-105",
                        level > 0 ? "w-8 h-8" : "w-10 h-10",
                        "ring-2 ring-background shadow-sm"
                    )}>
                        <AvatarImage src={reply.author.avatarUrl} alt={reply.author.username} />
                        <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold">
                            {reply.author.username[0].toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    {reply.isPinned && (
                        <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5 shadow-sm">
                            <Pin className="w-2.5 h-2.5 text-white fill-current" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-1.5 text-[14px]">
                            <span className="font-bold text-foreground hover:underline cursor-pointer tracking-tight">
                                {reply.author.displayName}
                            </span>
                            <span className="text-muted-foreground font-medium">@{reply.author.username}</span>
                            <span className="text-muted-foreground/50">·</span>
                            <span className="text-muted-foreground text-xs hover:underline whitespace-nowrap">
                                {formatDistanceToNow(new Date(reply.createdAt)).replace('about ', '').replace(' minutes', 'm').replace(' hours', 'h').replace(' days', 'd')}
                            </span>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="h-8 w-8 -mr-2 flex items-center justify-center rounded-full text-muted-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-foreground transition-colors opacity-0 group-hover/item:opacity-100">
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
                                <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg">
                                    <Edit3 className="w-4 h-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg">
                                    <Pin className="w-4 h-4" /> Pin comment
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg text-red-500 focus:text-red-500">
                                    <Trash2 className="w-4 h-4" /> Delete
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg">
                                    <Flag className="w-4 h-4" /> Report
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Reply To info */}
                    {(reply.replyTo || parentAuthorUsername) && (
                        <p className="text-[13px] text-muted-foreground">
                            Replying to <span className="text-blue-500 font-medium hover:underline cursor-pointer">@{reply.replyTo || parentAuthorUsername}</span>
                        </p>
                    )}

                    {/* Content */}
                    <div className="text-[15px] leading-[1.45] text-foreground font-normal break-words whitespace-pre-wrap select-text">
                        {renderContent(reply.content)}
                    </div>

                    {/* Engagement Row */}
                    <div className="flex items-center gap-7 pt-1 -ml-2">
                        <button
                            onClick={() => setIsReplyOpen(!isReplyOpen)}
                            className={cn(
                                "flex items-center gap-1.5 transition-all group/btn",
                                isReplyOpen ? "text-blue-500" : "text-muted-foreground hover:text-blue-500"
                            )}
                        >
                            <div className="p-2 rounded-full group-hover/btn:bg-blue-500/10 transition-colors">
                                <MessageCircle className="w-[18px] h-[18px]" />
                            </div>
                            {reply.stats.comments > 0 && <span className="text-xs font-medium">{reply.stats.comments}</span>}
                        </button>

                        <button className="flex items-center gap-1.5 text-muted-foreground hover:text-green-500 transition-all group/btn">
                            <div className="p-2 rounded-full group-hover/btn:bg-green-500/10 transition-colors">
                                <Repeat2 className="w-[18px] h-[18px]" />
                            </div>
                        </button>

                        <button
                            onClick={handleLike}
                            className={cn(
                                "flex items-center gap-1.5 transition-all group/btn",
                                isLiked ? "text-pink-500" : "text-muted-foreground hover:text-pink-500"
                            )}
                        >
                            <div className="p-2 rounded-full group-hover/btn:bg-pink-500/10 transition-colors">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={isLiked ? "liked" : "unliked"}
                                        initial={{ scale: 0.7 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                    >
                                        <Heart className={cn("w-[18px] h-[18px]", isLiked && "fill-current")} />
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                            {likesCount > 0 && <span className="text-xs font-medium">{likesCount}</span>}
                        </button>

                        <button className="flex items-center gap-1.5 text-muted-foreground hover:text-blue-500 transition-all group/btn">
                            <div className="p-2 rounded-full group-hover/btn:bg-blue-500/10 transition-colors">
                                <Share2 className="w-[18px] h-[18px]" />
                            </div>
                        </button>
                    </div>

                    {/* Reply Input */}
                    <AnimatePresence>
                        {isReplyOpen && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 space-y-2 overflow-hidden"
                            >
                                <Textarea
                                    placeholder="Post your reply"
                                    className="text-base min-h-[100px] bg-transparent border-none focus-visible:ring-0 p-0 resize-none placeholder:text-muted-foreground/50"
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex justify-end pt-2 border-t border-border/50">
                                    <Button
                                        size="sm"
                                        className="rounded-full px-5 font-bold bg-blue-500 hover:bg-blue-600 text-white"
                                        onClick={handleReplySubmit}
                                        disabled={isSubmitting || !replyContent.trim()}
                                    >
                                        {isSubmitting && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
                                        Reply
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* View Replies Link */}
                    {reply.stats.comments > 0 && !showReplies && (
                        <button
                            onClick={handleFetchReplies}
                            className="flex items-center gap-3 py-2 group/replies"
                        >
                            <div className="w-8 h-px bg-blue-500 transition-all group-hover/replies:w-12" />
                            <span className="text-[14px] font-bold text-blue-500 hover:underline">
                                {isLoadingReplies ? "Loading replies..." : `Show ${reply.stats.comments} ${reply.stats.comments === 1 ? 'reply' : 'replies'}`}
                            </span>
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Child Replies */}
            {showReplies && (
                <div className="flex flex-col">
                    {isLoadingReplies && childReplies.length === 0 ? (
                        <div className="py-4 flex justify-center">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        </div>
                    ) : (
                        childReplies.map((child, idx) => (
                            <ReplyItem
                                key={child.id}
                                reply={{
                                    ...child,
                                    author: {
                                        username: child.author.username,
                                        displayName: child.author.name || child.author.username,
                                        avatarUrl: child.author.avatarUrl || undefined
                                    },
                                    stats: {
                                        likes: child.stats?.likes || 0,
                                        comments: child.stats?.replies || 0
                                    },
                                    createdAt: new Date(child.createdAt)
                                }}
                                postId={postId}
                                level={level + 1}
                                isNested={true}
                                parentAuthorUsername={reply.author.username}
                                isLast={idx === childReplies.length - 1}
                                hasConnector={idx !== childReplies.length - 1}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
