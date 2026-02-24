"use client";

import * as React from "react";
import Image from "next/image";
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, Send, Repeat2, ExternalLink } from "lucide-react";
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
    isPreview?: boolean;
}

export function MainPost({ post, isPreview = false }: MainPostProps) {
    const [isLiked, setIsLiked] = React.useState(post.isLiked);
    const [likesCount, setLikesCount] = React.useState(post.stats.likes);

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsLiked(!isLiked);
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    };

    return (
        <article className={cn(
            "w-full bg-background transition-colors duration-300",
            isPreview ? "pt-2 pb-4 px-4" : "pt-4 pb-2 px-4 space-y-4"
        )}>
            {/* Header: Author Info */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className={cn(
                        "transition-transform hover:scale-105 duration-200",
                        isPreview ? "w-10 h-10" : "w-12 h-12"
                    )}>
                        <AvatarImage src={post.author.avatarUrl} alt={post.author.username} />
                        <AvatarFallback>{post.author.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                            <span className="font-bold text-[16px] hover:underline cursor-pointer tracking-tight">
                                {post.author.displayName}
                            </span>
                            {post.author.isVerified && (
                                <svg className="w-[18px] h-[18px] text-blue-500 fill-current" viewBox="0 0 24 24">
                                    <path d="M22.5 12.5c0-1.58-.8-2.47-1.24-3.23-.33-.57-.42-1.1-.42-1.72 0-1.63-1.31-2.94-2.94-2.94-.62 0-1.15.09-1.72.42-.76.44-1.65 1.24-3.23 1.24s-2.47-.8-3.23-1.24c-.57-.33-1.1-.42-1.72-.42-1.63 0-2.94 1.31-2.94 2.94 0 .62.09 1.15.42 1.72.44.76 1.24 1.65 1.24 3.23s-.8 2.47-1.24 3.23c-.33.57-.42 1.1-.42 1.72 0 1.63 1.31 2.94 2.94 2.94.62 0 1.15-.09 1.72-.42.76-.44 1.65-1.24 3.23-1.24s2.47.8 3.23 1.24c.57.33 1.1.42 1.72.42 1.63 0 2.94-1.31 2.94-2.94 0-.62-.09-1.15-.42-1.72-.44-.76-1.24-1.65-1.24-3.23zM9.69 16.1L6.1 12.5l1.41-1.41 2.18 2.18 5.18-5.18 1.41 1.41-6.59 6.6z" />
                                </svg>
                            )}
                        </div>
                        <span className="text-muted-foreground text-[14px]">@{post.author.username}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {!isPreview && (
                        <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800">
                            <MoreHorizontal className="w-5 h-5" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className={cn("space-y-4", isPreview && "mt-3")}>
                <p className={cn(
                    "leading-[1.4] break-words whitespace-pre-wrap text-foreground",
                    isPreview ? "text-[16px]" : "text-[21px] font-normal"
                )}>
                    {post.content}
                </p>

                {/* Media */}
                {post.media && post.media.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative rounded-2xl overflow-hidden border border-border/50 bg-neutral-100 dark:bg-neutral-900 shadow-sm"
                    >
                        {post.media.map((item, i) => (
                            <div key={i} className="aspect-video relative group cursor-zoom-in">
                                <Image
                                    src={item.url}
                                    alt="Post media"
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                                    sizes="(max-width: 768px) 100vw, 700px"
                                    priority
                                />
                            </div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Timestamp & Metadata */}
            <div className="flex items-center gap-1 text-muted-foreground text-[14px] pt-1">
                <time className="hover:underline cursor-pointer">{format(post.createdAt, "h:mm a")}</time>
                <span>·</span>
                <time className="hover:underline cursor-pointer">{format(post.createdAt, "MMM d, yyyy")}</time>
                <span className="mx-1">·</span>
                <span className="font-bold text-foreground">1.2M</span>
                <span className="text-muted-foreground">Views</span>
            </div>

            <Separator className="bg-border/40" />

            {/* Stats Row */}
            <div className="flex items-center gap-6 py-0.5">
                <div className="flex items-center gap-1 group cursor-pointer py-2">
                    <span className="text-[14px] font-bold text-foreground group-hover:underline">{post.stats.reposts.toLocaleString()}</span>
                    <span className="text-[14px] text-muted-foreground">Reposts</span>
                </div>
                <div className="flex items-center gap-1 group cursor-pointer py-2">
                    <span className="text-[14px] font-bold text-foreground group-hover:underline">{(Math.floor(post.stats.likes / 15)).toLocaleString()}</span>
                    <span className="text-[14px] text-muted-foreground">Quotes</span>
                </div>
                <div className="flex items-center gap-1 group cursor-pointer py-2">
                    <span className="text-[14px] font-bold text-foreground group-hover:underline">{likesCount.toLocaleString()}</span>
                    <span className="text-[14px] text-muted-foreground">Likes</span>
                </div>
                <div className="flex items-center gap-1 group cursor-pointer py-2">
                    <span className="text-[14px] font-bold text-foreground group-hover:underline">456</span>
                    <span className="text-[14px] text-muted-foreground">Bookmarks</span>
                </div>
            </div>

            <Separator className="bg-border/40" />

            {/* Engagement Icons */}
            <div className="flex justify-between items-center px-2 py-1">
                <button className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 transition-all group p-2">
                    <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors">
                        <MessageCircle className="w-[20px] h-[20px]" />
                    </div>
                </button>
                <button className="flex items-center gap-2 text-muted-foreground hover:text-green-500 transition-all group p-2">
                    <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-colors">
                        <Repeat2 className="w-[20px] h-[20px]" />
                    </div>
                </button>
                <button
                    onClick={handleLike}
                    className={cn(
                        "flex items-center gap-2 transition-all group p-2",
                        isLiked ? "text-pink-500" : "text-muted-foreground hover:text-pink-500"
                    )}
                >
                    <div className="p-2 rounded-full group-hover:bg-pink-500/10 transition-colors">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isLiked ? "liked" : "unliked"}
                                whileTap={{ scale: 1.5 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                                <Heart className={cn("w-[20px] h-[20px]", isLiked && "fill-current")} />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </button>
                <button className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 transition-all group p-2">
                    <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors">
                        <Bookmark className="w-[20px] h-[20px]" />
                    </div>
                </button>
                <button className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 transition-all group p-2">
                    <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors">
                        <Share2 className="w-[20px] h-[20px]" />
                    </div>
                </button>
            </div>
        </article>
    );
}
