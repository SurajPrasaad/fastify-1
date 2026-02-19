"use client"

import * as React from "react"
// import Image from "next/image"
import {
    ArrowBigUp,
    ArrowBigDown,
    MessageSquare,
    Share,
    MoreHorizontal,
    Plus,
    Award,
    Trash2,
    Archive,
    Pencil,
    Bookmark,
    BookmarkCheck
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { postService } from "@/services/post.service"
import { useToggleLike, useToggleBookmark } from "@/features/interaction/hooks"
import { CommentList } from "@/components/comments/comment-list"
import { useAuth } from "@/hooks/use-auth"
import { useSocial } from "@/hooks/use-user"
import { UserService } from "@/services/user.service"

export interface Post {
    id: string
    userId: string
    author: {
        username: string
        displayName: string
        avatarUrl?: string
        isVerified?: boolean
    }
    content: string
    media?: {
        type: "image" | "video"
        url: string
        aspectRatio?: number
    }[]
    stats: {
        likes: number
        comments: number
        shares: number
    }
    createdAt: Date
    isLiked?: boolean
    isBookmarked?: boolean
}

interface PostCardProps {
    post: Post;
    onRemove?: (id: string) => void;
    onUpdate?: (id: string, updatedData: Partial<Post>) => void;
    onLikeToggle?: (isLiked: boolean) => void;
}

export function PostCard({ post, onRemove, onUpdate, onLikeToggle }: PostCardProps) {
    const router = useRouter()
    const { user } = useAuth()
    const [showComments, setShowComments] = React.useState(false)
    const [isEditing, setIsEditing] = React.useState(false)
    const [editedContent, setEditedContent] = React.useState(post.content)

    const isOwner = user?.id === post.userId

    // Follow functionality
    const [isFollowing, setIsFollowing] = React.useState(false)
    const { follow, isFollowing: isFollowPending } = useSocial(post.userId, post.author.username)

    const handleFollow = (e: React.MouseEvent) => {
        e.stopPropagation()
        follow()
        setIsFollowing(true)
    }

    // Live Interaction Hooks
    const { isLiked, count: likesCount, toggleLike, isPending: isLikePending } = useToggleLike(post.isLiked, post.stats.likes, onLikeToggle);
    const { isBookmarked, toggleBookmark, isPending: isBookmarkPending } = useToggleBookmark(post.isBookmarked);

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation()
        toggleLike(post.id, "POST")
    }

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this post?")) return;

        const toastId = toast.loading("Deleting post...");
        try {
            await postService.deletePost(post.id);
            toast.success("Post deleted", { id: toastId });
            onRemove?.(post.id);
        } catch (error: any) {
            const message = error?.response?.data?.message || error?.message || "Failed to delete post";
            toast.error(message, { id: toastId });
        }
    };

    const handleArchive = async () => {
        const toastId = toast.loading("Archiving post...");
        try {
            await postService.archivePost(post.id);
            toast.success("Post archived", { id: toastId });
            onRemove?.(post.id);
        } catch (error: any) {
            const message = error?.response?.data?.message || error?.message || "Failed to archive post";
            toast.error(message, { id: toastId });
        }
    };

    const handleSaveEdit = async () => {
        if (editedContent === post.content) {
            setIsEditing(false);
            return;
        }

        const toastId = toast.loading("Updating post...");
        try {
            const updatedPost = await postService.updatePost(post.id, { content: editedContent });
            toast.success("Post updated", { id: toastId });
            setIsEditing(false);

            // Notify parent to update the list
            onUpdate?.(post.id, {
                content: editedContent,
                // If backend returned full post, we could use that. 
                // Mostly content is what changes here.
            });
        } catch (error: any) {
            const message = error?.response?.data?.message || error?.message || "Failed to update post";
            toast.error(message, { id: toastId });
        }
    };

    const timeAgo = (() => {
        try {
            return post.createdAt instanceof Date && !isNaN(post.createdAt.getTime())
                ? formatDistanceToNow(post.createdAt, { addSuffix: false })
                : "just now";
        } catch (e) {
            return "just now";
        }
    })()

    // Extract title (first line) and body (the rest)
    const lines = post.content.split('\n')
    const title = lines[0]
    const body = lines.slice(1).join('\n')

    return (
        <Card className="group hover:bg-accent/5 transition-colors duration-200 border-x-0 sm:border-x sm:rounded-xl shadow-none overflow-hidden bg-card">
            <CardHeader className="flex flex-row items-center gap-3 p-3 pb-2">
                <Avatar className="h-6 w-6">
                    <AvatarImage src={post.author.avatarUrl} alt={post.author.username} />
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {post.author.displayName?.[0] || 'U'}
                    </AvatarFallback>
                </Avatar>

                <div className="flex flex-1 items-center gap-1.5 min-w-0">
                    <span className="font-bold text-[13px] hover:underline cursor-pointer truncate">
                        @{post.author.username}
                    </span>
                    <span className="text-muted-foreground text-[12px] flex-shrink-0">
                        · {timeAgo} ago
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {isOwner ? (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-3 rounded-full border-primary/20 hover:bg-primary/5 text-[12px] font-bold gap-1 hidden sm:flex"
                            onClick={() => setIsEditing(true)}
                        >
                            Edit <Pencil className="h-3 w-3" />
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            variant={isFollowing ? "outline" : "default"}
                            className={cn(
                                "h-7 px-3 rounded-full text-[12px] font-bold gap-1 hidden sm:flex transition-all",
                                !isFollowing && "bg-blue-600 hover:bg-blue-700",
                                isFollowing && "border-primary/20 bg-accent/50"
                            )}
                            onClick={handleFollow}
                            disabled={isFollowPending || isFollowing}
                        >
                            {isFollowing ? "Following" : "Follow"}
                            {!isFollowing && <Plus className="h-3 w-3" />}
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem className="gap-2" onClick={() => setIsEditing(true)}>
                                <Pencil className="h-4 w-4" /> <span>Edit post</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleArchive} className="gap-2">
                                <Archive className="h-4 w-4" /> <span>Archive</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleDelete} className="gap-2 text-destructive focus:text-destructive">
                                <Trash2 className="h-4 w-4" /> <span>Delete</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className="p-3 pt-0 flex flex-col gap-3">
                {isEditing ? (
                    <div className="space-y-3">
                        <textarea
                            className="w-full min-h-[120px] p-4 rounded-xl bg-accent/30 border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/20 text-[14px] resize-none leading-relaxed"
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            placeholder="Edit your post..."
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditedContent(post.content);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSaveEdit}
                                disabled={!editedContent.trim() || editedContent === post.content}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <h3 className="font-bold text-[17px] leading-tight text-foreground transition-colors">
                            {title}
                        </h3>
                        {body && (
                            <p className="text-[14px] text-muted-foreground leading-snug line-clamp-3 overflow-hidden text-ellipsis whitespace-pre-wrap">
                                {body}
                            </p>
                        )}
                    </div>
                )}

                {/* Prominent Media Display */}
                {post.media && post.media.length > 0 && (
                    <div className={cn(
                        "rounded-2xl overflow-hidden border bg-muted/30 group-hover:border-primary/20 transition-all duration-300",
                        post.media.length === 1 ? "aspect-auto max-h-[512px]" : "grid grid-cols-2 gap-1 aspect-square"
                    )}>
                        {post.media.map((m, i) => (
                            <div key={i} className={cn(
                                "relative group/media overflow-hidden bg-black/5 flex items-center justify-center",
                                post.media?.length === 3 && i === 0 ? "row-span-2" : ""
                            )}>
                                {m.type === "image" ? (
                                    <img
                                        src={m.url}
                                        alt={`Post media ${i + 1}`}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover/media:scale-105"
                                    />
                                ) : (
                                    <video
                                        src={m.url}
                                        controls
                                        className="w-full h-full object-contain bg-black transition-transform duration-500 group-hover/media:scale-105"
                                        poster={m.url.replace(/\.[^/.]+$/, ".jpg")} // Cloudinary thumbnail trick
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            <CardFooter className="px-3 py-2 pt-0 flex items-center gap-2">
                {/* Vote Group */}
                <div className="flex items-center bg-accent/50 rounded-full h-8 overflow-hidden">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "h-full px-2.5 rounded-none hover:bg-orange-500/10 hover:text-orange-600",
                            isLiked && "text-orange-600"
                        )}
                        onClick={handleLike}
                    >
                        <ArrowBigUp className={cn("h-5 w-5", isLiked && "fill-current")} />
                        <span className="text-[12px] font-bold ml-1">{likesCount > 1000 ? `${(likesCount / 1000).toFixed(1)}k` : likesCount}</span>
                    </Button>
                    <div className="w-[1px] h-4 bg-muted-foreground/20" />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-full px-2.5 rounded-none hover:bg-indigo-500/10 hover:text-indigo-600"
                    >
                        <ArrowBigDown className="h-5 w-5" />
                    </Button>
                </div>

                {/* Comment Group */}
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-8 px-3 rounded-full bg-accent/50 hover:bg-accent/80 gap-2 text-[12px] font-bold",
                        showComments && "bg-primary/10 text-primary"
                    )}
                    onClick={() => setShowComments(!showComments)}
                >
                    <MessageSquare className="h-4 w-4" />
                    {post.stats.comments}
                </Button>

                {/* Share Group */}
                <Button variant="ghost" size="sm" className="h-8 px-3 rounded-full bg-accent/50 hover:bg-accent/80 gap-2 text-[12px] font-bold">
                    <Share className="h-4 w-4" />
                    Share
                </Button>

                {/* Bookmark Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "h-8 w-8 rounded-full bg-accent/50 hover:bg-accent/80",
                        isBookmarked && "text-blue-500 bg-blue-500/10 hover:bg-blue-500/20"
                    )}
                    onClick={() => toggleBookmark(post.id)}
                    disabled={isBookmarkPending}
                >
                    {isBookmarked ? <BookmarkCheck className="h-4 w-4 fill-current" /> : <Bookmark className="h-4 w-4" />}
                </Button>
            </CardFooter>

            {showComments && (
                <div className="border-t animate-in slide-in-from-top duration-300">
                    <CommentList postId={post.id} />
                </div>
            )}
        </Card>
    )
}
