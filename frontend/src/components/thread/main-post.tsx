"use client";

import * as React from "react";
import Image from "next/image";
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, Send, Repeat2 } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface MainPostProps {
    post: {
        id: string;
        author: {
            username: string;
            displayName: string;
            avatarUrl?: string;
            isVerified?: boolean;
        };
        content: string;
        media?: {
            type: "image" | "video";
            url: string;
        }[];
        stats: {
            likes: number;
            comments: number;
            reposts: number;
        };
        createdAt: Date;
        isLiked?: boolean;
    };
}

export function MainPost({ post }: MainPostProps) {
    const [isLiked, setIsLiked] = React.useState(post.isLiked);
    const [likesCount, setLikesCount] = React.useState(post.stats.likes);

    const handleLike = () => {
        setIsLiked(!isLiked);
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    };

    return (
        <article className="w-full bg-background pt-4 pb-2 px-4 space-y-4">
            {/* Header: Author Info */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                        <AvatarImage src={post.author.avatarUrl} alt={post.author.username} />
                        <AvatarFallback>{post.author.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                            <span className="font-bold text-base hover:underline cursor-pointer">
                                {post.author.displayName}
                            </span>
                            {post.author.isVerified && (
                                <svg className="w-4 h-4 text-primary fill-current" viewBox="0 0 24 24">
                                    <path d="M22.5 12.5c0-1.58-.8-2.47-1.24-3.23-.33-.57-.42-1.1-.42-1.72 0-1.63-1.31-2.94-2.94-2.94-.62 0-1.15.09-1.72.42-.76.44-1.65 1.24-3.23 1.24s-2.47-.8-3.23-1.24c-.57-.33-1.1-.42-1.72-.42-1.63 0-2.94 1.31-2.94 2.94 0 .62.09 1.15.42 1.72.44.76 1.24 1.65 1.24 3.23s-.8 2.47-1.24 3.23c-.33.57-.42 1.1-.42 1.72 0 1.63 1.31 2.94 2.94 2.94.62 0 1.15-.09 1.72-.42.76-.44 1.65-1.24 3.23-1.24s2.47.8 3.23 1.24c.57.33 1.1.42 1.72.42 1.63 0 2.94-1.31 2.94-2.94 0-.62-.09-1.15-.42-1.72-.44-.76-1.24-1.65-1.24-3.23zM9.69 16.1L6.1 12.5l1.41-1.41 2.18 2.18 5.18-5.18 1.41 1.41-6.59 6.6z" />
                                </svg>
                            )}
                        </div>
                        <span className="text-muted-foreground text-sm">@{post.author.username}</span>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground">
                    <MoreHorizontal className="w-5 h-5" />
                </Button>
            </div>

            {/* Content */}
            <div className="space-y-4">
                <p className="text-[20px] leading-relaxed break-words whitespace-pre-wrap">
                    {post.content}
                </p>

                {/* Media */}
                {post.media && post.media.length > 0 && (
                    <div className="relative rounded-2xl overflow-hidden border border-border">
                        {post.media.map((item, i) => (
                            <div key={i} className="aspect-auto min-h-[300px] relative bg-muted">
                                <Image
                                    src={item.url}
                                    alt="Post media"
                                    fill
                                    className="object-cover"
                                    sizes="100vw"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Timestamp & Metadata */}
            <div className="flex items-center gap-1 text-muted-foreground text-[15px] pt-2">
                <time>{format(post.createdAt, "h:mm a")}</time>
                <span>·</span>
                <time>{format(post.createdAt, "MMM d, yyyy")}</time>
                <span className="hidden sm:inline">·</span>
                <span className="hidden sm:inline font-bold text-foreground">1.2M</span>
                <span className="hidden sm:inline text-muted-foreground">Views</span>
            </div>

            <Separator className="bg-border/50" />

            {/* Stats Row */}
            <div className="flex items-center gap-6 py-1">
                <div className="flex items-center gap-1 group cursor-pointer">
                    <span className="text-sm font-bold group-hover:underline">{post.stats.reposts.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">Reposts</span>
                </div>
                <div className="flex items-center gap-1 group cursor-pointer">
                    <span className="text-sm font-bold group-hover:underline">{Math.floor(post.stats.likes / 10).toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">Quotes</span>
                </div>
                <div className="flex items-center gap-1 group cursor-pointer">
                    <span className="text-sm font-bold group-hover:underline">{likesCount.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">Likes</span>
                </div>
                <div className="flex items-center gap-1 group cursor-pointer">
                    <span className="text-sm font-bold group-hover:underline">456</span>
                    <span className="text-sm text-muted-foreground">Bookmarks</span>
                </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Engagement Icons */}
            <div className="flex justify-around items-center py-1 sm:justify-start sm:gap-12">
                <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
                    <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                        <MessageCircle className="w-5 h-5" />
                    </div>
                </button>
                <button className="flex items-center gap-2 text-muted-foreground hover:text-green-500 transition-colors group">
                    <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-colors">
                        <Repeat2 className="w-5 h-5" />
                    </div>
                </button>
                <button
                    onClick={handleLike}
                    className={cn(
                        "flex items-center gap-2 transition-colors group",
                        isLiked ? "text-pink-500" : "text-muted-foreground hover:text-pink-500"
                    )}
                >
                    <div className="p-2 rounded-full group-hover:bg-pink-500/10 transition-colors">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isLiked ? "liked" : "unliked"}
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.8 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                                <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </button>
                <button className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 transition-colors group">
                    <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors">
                        <Bookmark className="w-5 h-5" />
                    </div>
                </button>
                <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
                    <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                        <Share2 className="w-5 h-5" />
                    </div>
                </button>
            </div>

            <Separator className="bg-border/50 mb-0" />
        </article>
    );
}
