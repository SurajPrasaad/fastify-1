import * as React from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Reply } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageSquare, Repeat2, Share } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReplyCardProps {
    reply: Reply;
    isLast?: boolean;
}

export const ReplyCard = React.memo(({ reply, isLast }: ReplyCardProps) => {
    const formattedDate = formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true });

    return (
        <div className={cn(
            "p-4 hover:bg-accent/20 transition-colors cursor-pointer group",
            !isLast && "border-b border-border/30"
        )}>
            <div className="flex gap-3">
                {/* Avatar Column */}
                <div className="flex flex-col items-center">
                    <Avatar className="w-10 h-10 border border-border/50">
                        <AvatarImage src={reply.author.avatarUrl || ""} alt={reply.author.username} />
                        <AvatarFallback>{reply.author.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {!isLast && <div className="w-0.5 grow bg-border/20 my-1 rounded-full" />}
                </div>

                {/* Content Column */}
                <div className="flex-1 space-y-2">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-foreground group-hover:underline underline-offset-2">
                                {reply.author.name}
                            </span>
                            <span className="text-muted-foreground text-sm">
                                @{reply.author.username}
                            </span>
                            <span className="text-muted-foreground text-sm">·</span>
                            <span className="text-muted-foreground text-sm">
                                {formattedDate}
                            </span>
                        </div>
                    </div>

                    {/* Replying To Section */}
                    <div className="text-sm">
                        <span className="text-muted-foreground">Replying to </span>
                        <Link
                            href={`/${reply.post.author.username}`}
                            className="text-primary hover:underline font-medium"
                            onClick={(e) => e.stopPropagation()}
                        >
                            @{reply.post.author.username}
                        </Link>
                    </div>

                    {/* Reply Content */}
                    <p className="text-[15px] leading-relaxed text-foreground whitespace-pre-wrap">
                        {reply.content}
                    </p>

                    {/* Original Post Preview */}
                    <Link
                        href={`/post/${reply.postId}`}
                        className="block mt-3 border border-border/50 rounded-xl p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Avatar className="w-5 h-5">
                                <AvatarImage src={reply.post.author.avatarUrl || ""} />
                                <AvatarFallback>{reply.post.author.username[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-semibold">@{reply.post.author.username}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {reply.post.content}
                        </p>
                    </Link>

                    {/* Actions */}
                    <div className="flex items-center justify-between max-w-md pt-2">
                        <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors group/btn">
                            <div className="p-2 rounded-full group-hover/btn:bg-primary/10">
                                <MessageSquare className="w-4 h-4" />
                            </div>
                            <span className="text-xs">0</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-muted-foreground hover:text-green-500 transition-colors group/btn">
                            <div className="p-2 rounded-full group-hover/btn:bg-green-500/10">
                                <Repeat2 className="w-4 h-4" />
                            </div>
                            <span className="text-xs">0</span>
                        </button>
                        <button className={cn(
                            "flex items-center gap-1.5 transition-colors group/btn",
                            reply.isLiked ? "text-pink-500" : "text-muted-foreground hover:text-pink-500"
                        )}>
                            <div className="p-2 rounded-full group-hover/btn:bg-pink-500/10">
                                <Heart className={cn("w-4 h-4", reply.isLiked && "fill-current")} />
                            </div>
                            <span className="text-xs">{reply.stats.likes}</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors group/btn">
                            <div className="p-2 rounded-full group-hover/btn:bg-primary/10">
                                <Share className="w-4 h-4" />
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

ReplyCard.displayName = "ReplyCard";
