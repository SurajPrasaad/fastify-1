"use client"

import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useToggleLike, useCreateComment } from "@/features/interaction/hooks"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, CheckCircle2, MoreHorizontal } from "lucide-react"
import { PostPoll } from "@/features/feed/components/PostPoll"
import { PostMedia } from "@/features/feed/components/PostMedia"
import { Button } from "@/components/ui/button"
import Link from "next/link"


export interface Post {
    id: string
    userId: string
    author: {
        username: string
        name: string
        avatarUrl?: string | null
        isVerified?: boolean
    }
    content: string
    mediaUrls?: string[]
    location?: string | null
    pollId?: string | null
    poll?: {
        id: string
        question: string
        options: {
            id: string
            text: string
            votesCount: number
        }[]
        expiresAt: string | Date
        userVotedOptionId?: string | null
    } | null
    likesCount: number
    commentsCount: number
    sharesCount?: number
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "DELETED"
    createdAt: string | Date
    updatedAt: string | Date
    isLiked?: boolean
    isBookmarked?: boolean
    originalPostId?: string | null
    originalPost?: {
        id: string
        content: string
        createdAt: string | Date
        author: {
            username: string
            name: string
            avatarUrl?: string | null
        }
    } | null
}

interface PostCardProps {
    post: Post;
    onLikeToggle?: (isLiked: boolean) => void;
    onRemove?: (id: string) => void;
    onUpdate?: (id: string, updatedData: Partial<Post>) => void;
}

export function PostCard({ post, onLikeToggle, onRemove, onUpdate }: PostCardProps) {
    const router = useRouter()
    const { isLiked, count: currentLikesCount, toggleLike } = useToggleLike(post.isLiked, post.likesCount || 0, onLikeToggle);
    const { createComment, isSubmitting: isPostingComment } = useCreateComment();

    const [isCommentOpen, setIsCommentOpen] = React.useState(false);
    const [commentContent, setCommentContent] = React.useState("");

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation()
        toggleLike(post.id, "POST")
    }

    const timeAgo = (() => {
        try {
            const date = new Date(post.createdAt);
            return !isNaN(date.getTime())
                ? formatDistanceToNow(date, { addSuffix: false })
                : "just now";
        } catch (e) {
            return "just now";
        }
    })()

    const renderContent = (content: string) => {
        return content.split(/(\s+)/).map((part, i) => {
            if (part && part.startsWith('#')) {
                return (
                    <span key={i} className="text-primary hover:underline cursor-pointer transition-colors" onClick={(e) => {
                        e.stopPropagation()
                    }}>
                        {part}
                    </span>
                )
            }
            return part
        })
    }


    return (
        <article
            className="p-4 border-b border-slate-200 dark:border-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-900/40 transition-all cursor-pointer group/post"
            onClick={() => router.push(`/post/${post.id}`)}
        >
            <div className="flex gap-4">
                {/* Avatar */}
                <div className="size-12 rounded-full bg-slate-500 overflow-hidden shrink-0 transition-transform group-hover/post:scale-105">
                    <img
                        className="w-full h-full object-cover"
                        alt={post.author.username}
                        src={post.author.avatarUrl || `https://api.dicebear.com/7.x/beta/svg?seed=${post.userId}`}
                    />
                </div>

                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1 flex-wrap min-w-0">
                            <span className="font-bold hover:underline truncate">{post.author.name}</span>
                            {post.author.isVerified && (
                                <span className="material-symbols-outlined text-primary text-[18px] select-none" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    verified
                                </span>
                            )}
                            <span className="text-slate-500 truncate lowercase">@{post.author.username}</span>
                            <span className="text-slate-500 shrink-0">· {timeAgo}</span>
                        </div>
                        <span className="material-symbols-outlined text-slate-500 hover:text-primary transition-colors cursor-pointer p-1 hover:bg-primary/10 rounded-full">
                            more_horiz
                        </span>
                    </div>

                    {/* Location */}
                    {post.location && (
                        <div className="flex items-center gap-1 text-slate-500 text-[13px] mb-1">
                            <MapPin size={12} />
                            {post.location}
                        </div>
                    )}

                    {/* Content */}
                    {post.content && (
                        <div className="text-[15px] leading-relaxed mb-3 whitespace-pre-wrap dark:text-slate-200">
                            {renderContent(post.content)}
                        </div>
                    )}

                    {/* Original Post (Repost/Quote) */}
                    {post.originalPost && (
                        <div
                            className="mt-3 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (post.originalPost) router.push(`/post/${post.originalPost.id}`);
                            }}
                        >
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="size-5 rounded-full bg-slate-500 overflow-hidden shrink-0">
                                    <img
                                        src={post.originalPost.author.avatarUrl || `https://api.dicebear.com/7.x/beta/svg?seed=${post.originalPost.author.username}`}
                                        className="w-full h-full object-cover"
                                        alt={post.originalPost.author.username}
                                    />
                                </div>
                                <span className="font-bold text-sm truncate">{post.originalPost.author.name}</span>
                                <span className="text-slate-500 text-sm truncate">@{post.originalPost.author.username}</span>
                            </div>
                            <div className="text-[14px] leading-normal dark:text-slate-300">
                                {renderContent(post.originalPost.content)}
                            </div>
                        </div>
                    )}

                    {/* Poll */}
                    {post.poll && <PostPoll poll={post.poll as any} postId={post.id} />}

                    {/* Media */}
                    <PostMedia mediaUrls={post.mediaUrls} type={post.poll ? 'POLL' : 'IMAGE'} />

                    {/* Engagement Bar */}
                    <div className="flex items-center justify-between mt-3 text-slate-500 max-w-md -ml-2">
                        <EngagementAction
                            icon="chat_bubble"
                            count={post.commentsCount || 0}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsCommentOpen(!isCommentOpen);
                            }}
                            hoverClass="hover:text-primary hover:bg-primary/10"
                        />
                        <EngagementAction
                            icon="repeat"
                            count={0}
                            hoverClass="hover:text-green-500 hover:bg-green-500/10"
                        />
                        <EngagementAction
                            icon="favorite"
                            count={currentLikesCount}
                            active={isLiked}
                            onClick={handleLike}
                            hoverClass="hover:text-red-500 hover:bg-red-500/10"
                        />
                        <EngagementAction
                            icon="bookmark"
                            count={0}
                            hoverClass="hover:text-primary hover:bg-primary/10"
                        />
                    </div>

                    {/* Inline Comment Input */}
                    {isCommentOpen && (
                        <div className="mt-4 space-y-3 pl-0 animate-in fade-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
                            <Textarea
                                placeholder="Post your reply"
                                value={commentContent}
                                onChange={(e) => setCommentContent(e.target.value)}
                                className="min-h-[100px] w-full bg-transparent border-none focus-visible:ring-0 text-[17px] p-0 resize-none placeholder:text-slate-500"
                                autoFocus
                            />
                            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800/50">
                                <Button
                                    size="sm"
                                    className="rounded-full px-5 font-bold"
                                    disabled={!commentContent.trim() || isPostingComment}
                                    onClick={async () => {
                                        try {
                                            await createComment(post.id, commentContent, undefined, () => {
                                                setCommentContent("");
                                                setIsCommentOpen(false);
                                                if (onUpdate) {
                                                    onUpdate(post.id, { commentsCount: (post.commentsCount || 0) + 1 });
                                                }
                                            });
                                        } catch (err) {
                                            // Error handled by hook
                                        }
                                    }}
                                >
                                    {isPostingComment ? "Posting..." : "Reply"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </article>
    )
}

function EngagementAction({ icon, count, hoverClass, active, onClick }: {
    icon: string,
    count: number,
    hoverClass: string,
    active?: boolean,
    onClick?: (e: React.MouseEvent) => void
}) {
    return (
        <div
            className={cn(
                "flex items-center gap-2 group transition-colors",
                active && icon === "favorite" ? "text-red-500" : "hover:text-inherit",
                hoverClass.split(' ')[0]
            )}
            onClick={onClick}
        >
            <div className={cn("p-2 rounded-full transition-all", hoverClass.split(' ').slice(1).join(' '))}>
                <span
                    className="material-symbols-outlined text-[20px] select-none"
                    style={{ fontVariationSettings: `'FILL' ${active ? 1 : 0}` }}
                >
                    {icon}
                </span>
            </div>
            <span className="text-xs font-medium">{count > 0 ? (count > 999 ? (count / 1000).toFixed(1) + 'k' : count) : ""}</span>
        </div>
    )
}

