"use client"

import * as React from "react"
import {
    useToggleLike,
    useCreateComment
} from "@/features/interaction/hooks"
import { useInfiniteComments } from "@/features/comments/hooks"
import { commentApi } from "@/features/comments/api"
import { Comment } from "@/features/interaction/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, MessageSquare, Heart, ChevronDown, ChevronUp } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface CommentItemProps {
    comment: Comment;
    postId: string;
}

function CommentItem({ comment, postId }: CommentItemProps) {
    const [showReplies, setShowReplies] = React.useState(false);
    const [replies, setReplies] = React.useState<Comment[]>([]);
    const [isLoadingReplies, setIsLoadingReplies] = React.useState(false);
    const [isReplyOpen, setIsReplyOpen] = React.useState(false);
    const [replyContent, setReplyContent] = React.useState("");

    const { isLiked, count, toggleLike } = useToggleLike(comment.isLiked, comment.stats?.likes || 0);
    const { createComment, isSubmitting } = useCreateComment();

    const handleFetchReplies = async () => {
        if (showReplies) {
            setShowReplies(false);
            return;
        }

        setShowReplies(true);
        if (replies.length > 0) return;

        setIsLoadingReplies(true);
        try {
            const data = await commentApi.getCommentReplies(comment.id);
            setReplies(data);
        } catch (error) {
            setShowReplies(false);
        } finally {
            setIsLoadingReplies(false);
        }
    };

    const handleReply = async () => {
        await createComment(postId, replyContent, comment.id, (newReply) => {
            setReplies(prev => [newReply, ...prev]);
            setReplyContent("");
            setIsReplyOpen(false);
            setShowReplies(true);
        });
    };

    return (
        <div className="flex gap-3 py-3 px-4 group/comment">
            <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={comment.author.avatarUrl || ""} />
                <AvatarFallback>{comment.author.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">@{comment.author.username}</span>
                    <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                </div>

                <p className="text-sm leading-snug whitespace-pre-wrap">{comment.content}</p>

                <div className="flex items-center gap-4 pt-1">
                    <button
                        onClick={() => toggleLike(comment.id, "COMMENT")}
                        className={cn(
                            "flex items-center gap-1.5 text-xs font-medium transition-colors",
                            isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                        )}
                    >
                        <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                        {count > 0 && <span>{count}</span>}
                    </button>

                    <button
                        onClick={() => setIsReplyOpen(!isReplyOpen)}
                        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                    >
                        <MessageSquare className="h-4 w-4" />
                        Reply
                    </button>
                </div>

                {isReplyOpen && (
                    <div className="mt-3 space-y-2">
                        <Textarea
                            placeholder="Write a reply..."
                            className="text-sm min-h-[80px]"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setIsReplyOpen(false)}>Cancel</Button>
                            <Button size="sm" onClick={handleReply} disabled={isSubmitting || !replyContent.trim()}>
                                {isSubmitting && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
                                Reply
                            </Button>
                        </div>
                    </div>
                )}

                {(comment.stats?.replies || 0) > 0 && (
                    <button
                        onClick={handleFetchReplies}
                        className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-600 pt-2 transition-colors"
                    >
                        {showReplies ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {showReplies ? "Hide replies" : `View ${comment.stats?.replies || 0} replies`}
                    </button>
                )}

                {showReplies && (
                    <div className="mt-2 space-y-1 border-l-2 pl-4 border-muted">
                        {isLoadingReplies ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground py-4" />
                        ) : (
                            Array.isArray(replies) && replies.map(reply => (
                                <CommentItem key={reply.id} comment={reply} postId={postId} />
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export function CommentList({ postId }: { postId: string }) {
    const [comments, setComments] = React.useState<Comment[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [content, setContent] = React.useState("");
    const { createComment, isSubmitting } = useCreateComment();

    React.useEffect(() => {
        async function load() {
            try {
                const data = await commentApi.getPostComments(postId);
                setComments(data);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [postId]);

    const handleSubmit = async () => {
        await createComment(postId, content, undefined, (newComment) => {
            setComments(prev => [newComment, ...prev]);
            setContent("");
        });
    };

    return (
        <div className="flex flex-col h-full bg-background border-t">
            <div className="p-4 border-b sticky top-0 bg-background/80 backdrop-blur-md z-10 flex items-center justify-between">
                <h3 className="font-bold">Comments</h3>
                <span className="text-xs text-muted-foreground">{comments.length} total</span>
            </div>

            <div className="p-4 space-y-4">
                <div className="flex gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src="/avatars/user.jpg" />
                        <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                        <Textarea
                            placeholder="Add a comment..."
                            className="resize-none min-h-[100px]"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                        <div className="flex justify-end">
                            <Button size="sm" onClick={handleSubmit} disabled={isSubmitting || !content.trim()}>
                                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                Comment
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        No comments yet. Be the first to share your thoughts!
                    </div>
                ) : (
                    <div className="divide-y divide-muted/50">
                        {Array.isArray(comments) && comments.map(comment => (
                            <CommentItem key={comment.id} comment={comment} postId={postId} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
