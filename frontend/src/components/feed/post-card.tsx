"use client"

import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useToggleLike, useCreateComment, useRepost, useToggleBookmark } from "@/features/interaction/hooks"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, CheckCircle2, MoreHorizontal } from "lucide-react"
import { PostPoll } from "@/features/feed/components/PostPoll"
import { PostMedia } from "@/features/feed/components/PostMedia"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Image as ImageIcon, Smile, Image, Bookmark } from "lucide-react"
import Link from "next/link"
import { CommentList } from "@/components/comments/comment-list"
import { useCurrentUser } from "@/features/auth/hooks"
import { useUpdatePost, useDeletePost } from "@/features/posts/hooks"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Edit2, Trash2, Share, Link as LinkIcon, Flag, Repeat } from "lucide-react"
import { UpdatePostModal } from "./update-post-modal"


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
    repostsCount: number
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "DELETED"
    createdAt: string | Date
    updatedAt: string | Date
    isLiked?: boolean
    isBookmarked?: boolean
    isReposted?: boolean
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
    onPostCreated?: (post: Post) => void;
}

export function PostCard({ post, onLikeToggle, onRemove, onUpdate, onPostCreated }: PostCardProps) {
    const router = useRouter()
    const { isLiked, count: currentLikesCount, toggleLike } = useToggleLike(post.isLiked, post.likesCount || 0, onLikeToggle);
    const { createComment, isSubmitting: isPostingComment } = useCreateComment();
    const { repost, isSubmitting: isReposting } = useRepost();
    const { isBookmarked, toggleBookmark } = useToggleBookmark(post.isBookmarked);

    const [isCommentOpen, setIsCommentOpen] = React.useState(false);
    const [commentContent, setCommentContent] = React.useState("");
    const [repostCount, setRepostCount] = React.useState(post.repostsCount || 0);
    const [hasReposted, setHasReposted] = React.useState(!!post.isReposted);

    // Post Action Hooks
    const { data: currentUser } = useCurrentUser();
    const { updatePost, isUpdating } = useUpdatePost();
    const { deletePost, isDeleting } = useDeletePost();

    // Dialog States
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

    const isAuthor = currentUser?.id === post.userId;

    const handleDeletePost = async () => {
        try {
            await deletePost(post.id, () => {
                if (onRemove) onRemove(post.id);
                setIsDeleteDialogOpen(false);
            });
        } catch (error) {
            // Error handled by hook
        }
    };

    const handleUpdateSuccess = (updatedPost: any) => {
        if (onUpdate) onUpdate(post.id, updatedPost);
    };

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        const postUrl = `${window.location.origin}/post/${post.id}`;
        navigator.clipboard.writeText(postUrl);
        toast.success("Post link copied to clipboard");
    };

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation()
        toggleLike(post.id, "POST")
    }

    const mapToPost = (apiPost: any): Post => {
        return {
            ...apiPost,
            author: {
                ...apiPost.author,
                isVerified: false
            },
            status: "PUBLISHED",
            createdAt: apiPost.createdAt,
            updatedAt: apiPost.createdAt,
            mediaUrls: apiPost.mediaUrls || [],
            likesCount: apiPost.likesCount || 0,
            commentsCount: apiPost.commentsCount || 0,
            repostsCount: apiPost.repostsCount || 0,
        };
    };

    const handleSimpleRepost = async (e?: React.MouseEvent) => {
        if (e) e.stopPropagation()
        if (hasReposted || isReposting) return;
        try {
            await repost(post.id, undefined, (result) => {
                setRepostCount(prev => prev + 1);
                setHasReposted(true);
                if (onUpdate) {
                    onUpdate(post.id, { repostsCount: (post.repostsCount || 0) + 1 });
                }
                if (onPostCreated) onPostCreated(mapToPost(result));
            });
        } catch (error) {
            // Handled by hook
        }
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
            if (!part) return part;

            // Handle hashtags
            if (part.startsWith('#')) {
                return (
                    <span key={i} className="text-primary hover:underline cursor-pointer transition-colors" onClick={(e) => {
                        e.stopPropagation()
                    }}>
                        {part}
                    </span>
                )
            }

            // Handle mentions
            if (part.startsWith('@') && part.length > 1) {
                const username = part.slice(1);
                return (
                    <Link
                        key={i}
                        href={`/${username}`}
                        className="text-primary hover:underline font-medium transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {part}
                    </Link>
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

                        {/* More Menu */}
                        <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <span className="material-symbols-outlined text-slate-500 hover:text-primary transition-colors cursor-pointer p-1 hover:bg-primary/10 rounded-full">
                                        more_horiz
                                    </span>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={handleShare}>
                                        <Share className="mr-2 h-4 w-4" />
                                        <span>Share</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                        const postUrl = `${window.location.origin}/post/${post.id}`;
                                        navigator.clipboard.writeText(postUrl);
                                        toast.success("Link copied!");
                                    }}>
                                        <LinkIcon className="mr-2 h-4 w-4" />
                                        <span>Copy Link</span>
                                    </DropdownMenuItem>

                                    {isAuthor ? (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                                                <Edit2 className="mr-2 h-4 w-4" />
                                                <span>Edit Post</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => setIsDeleteDialogOpen(true)}
                                                className="text-red-500 focus:text-red-500"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                <span>Delete</span>
                                            </DropdownMenuItem>
                                        </>
                                    ) : (
                                        <DropdownMenuItem className="text-red-500 focus:text-red-500">
                                            <Flag className="mr-2 h-4 w-4" />
                                            <span>Report</span>
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
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
                            count={repostCount}
                            active={hasReposted}
                            onClick={handleSimpleRepost}
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
                            LucideIcon={Bookmark}
                            active={isBookmarked}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleBookmark(post.id);
                            }}
                            hoverClass="hover:text-primary hover:bg-primary/10"
                        />
                    </div>

                    {/* Inline Comment Input */}
                    {isCommentOpen && (
                        <div className="mt-6 mb-2 animate-in fade-in slide-in-from-top-4 duration-300 ease-out" onClick={(e) => e.stopPropagation()}>
                            <div className="bg-slate-900/40 dark:bg-white/[0.03] border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-4 shadow-sm backdrop-blur-sm transition-all hover:border-primary/30">
                                <div className="flex gap-4">
                                    <Avatar className="size-10 ring-2 ring-background border-2 border-slate-100 dark:border-slate-800">
                                        <AvatarImage src={currentUser?.avatarUrl || undefined} />
                                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                            {currentUser?.username?.[0]?.toUpperCase() || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-3">
                                        <Textarea
                                            placeholder="Write a comment..."
                                            value={commentContent}
                                            onChange={(e) => setCommentContent(e.target.value)}
                                            className="min-h-[80px] w-full bg-transparent border-none focus-visible:ring-0 text-[16px] p-0 resize-none placeholder:text-slate-500 font-display font-medium tracking-tight"
                                            autoFocus
                                        />
                                        <div className="flex items-center justify-between pt-0">
                                            <div className="flex items-center gap-1.5 -ml-2">
                                                <Button variant="ghost" size="icon" className="size-9 rounded-full text-primary hover:bg-primary/10">
                                                    <ImageIcon className="size-5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="size-9 rounded-full text-primary hover:bg-primary/10">
                                                    <Smile className="size-5" />
                                                </Button>
                                            </div>
                                            <Button
                                                size="sm"
                                                className="rounded-full px-6 font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                disabled={!commentContent.trim() || isPostingComment}
                                                onClick={async () => {
                                                    try {
                                                        await createComment(post.id, commentContent, undefined, () => {
                                                            setCommentContent("");
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
                                </div>
                            </div>

                            {/* Comments List */}
                            <div className="mt-8">
                                <CommentList postId={post.id} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Dialog */}
            <UpdatePostModal
                postId={post.id}
                isOpen={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                onUpdateSuccess={handleUpdateSuccess}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Post?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This post will be removed from your profile, the timeline of any accounts that follow you, and from search results.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeletePost}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </article >
    )
}

function EngagementAction({ icon, count, hoverClass, active, onClick, LucideIcon }: {
    icon: string,
    count: number,
    hoverClass: string,
    active?: boolean,
    onClick?: (e: React.MouseEvent) => void,
    LucideIcon?: any
}) {
    return (
        <div
            className={cn(
                "flex items-center gap-2 group transition-colors",
                active && icon === "favorite" ? "text-red-500" : "",
                active && icon === "repeat" ? "text-green-500" : "",
                active && icon === "bookmark" ? "text-primary" : "",
                !active ? "hover:text-inherit" : "",
                hoverClass.split(' ')[0]
            )}
            onClick={onClick}
        >
            <div className={cn("p-2 rounded-full transition-all", hoverClass.split(' ').slice(1).join(' '))}>
                {LucideIcon ? (
                    <LucideIcon className={cn("size-5", active && icon === "bookmark" && "fill-current")} />
                ) : (
                    <span
                        className="material-symbols-outlined text-[20px] select-none"
                        style={{ fontVariationSettings: `'FILL' ${active ? 1 : 0}` }}
                    >
                        {icon}
                    </span>
                )}
            </div>
            <span className="text-xs font-medium">{count > 0 ? (count > 999 ? (count / 1000).toFixed(1) + 'k' : count) : ""}</span>
        </div>
    )
}

