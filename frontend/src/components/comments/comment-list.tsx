"use client"

import * as React from "react"
import { useInfiniteComments } from "@/features/comments/hooks"
import { Comment } from "@/features/interaction/types"
import { Loader2, MessageCircle, AlertCircle, RefreshCcw } from "lucide-react"
import { ReplyItem, Reply } from "@/components/thread/reply-item"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CommentListProps {
    postId: string;
}

export function CommentList({ postId }: CommentListProps) {
    const {
        comments,
        isLoading,
        hasMore,
        fetchMore,
        error
    } = useInfiniteComments(postId);

    // Map the API Comment type to the Reply type expected by ReplyItem
    const mapCommentToReply = (c: Comment): Reply => ({
        id: c.id,
        author: {
            username: c.author?.username || "anonymous",
            displayName: c.author?.name || c.author?.username || "Anonymous",
            avatarUrl: c.author?.avatarUrl || undefined,
        },
        content: c.content,
        stats: {
            likes: c.stats?.likes || 0,
            comments: c.stats?.replies || 0,
        },
        createdAt: new Date(c.createdAt),
        isLiked: c.isLiked,
        replyTo: undefined,
    });

    const [isExpanded, setIsExpanded] = React.useState(false);
    const initialDisplayCount = 3;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 px-6 text-center">
                <AlertCircle className="h-10 w-10 text-red-500 opacity-50" />
                <div className="space-y-1">
                    <p className="font-bold text-red-500">Failed to load comments</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchMore(true)}
                    className="gap-2 rounded-full"
                >
                    <RefreshCcw className="h-4 w-4" />
                    Try again
                </Button>
            </div>
        );
    }

    if (isLoading && comments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse font-medium">Fetching conversation...</p>
            </div>
        );
    }

    if (!isLoading && comments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6 bg-slate-50/50 dark:bg-white/[0.02] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100 dark:border-slate-800">
                    <MessageCircle className="h-8 w-8 text-primary opacity-20" />
                </div>
                <h3 className="text-lg font-bold tracking-tight">No responses yet</h3>
                <p className="text-muted-foreground text-sm max-w-[250px]">
                    Join the conversation and be the first to share your perspective!
                </p>
            </div>
        );
    }

    const displayedComments = isExpanded ? comments : comments.slice(0, initialDisplayCount);
    const hiddenCount = comments.length - initialDisplayCount;

    return (
        <div className="flex flex-col">
            <div className={cn(
                "flex flex-col transition-all duration-300",
                isExpanded ? "max-h-[600px] overflow-y-auto pr-1 -mr-1 custom-scrollbar" : ""
            )}>
                {displayedComments.map((comment, index) => (
                    <ReplyItem
                        key={comment.id}
                        reply={mapCommentToReply(comment)}
                        postId={postId}
                        isLast={(isExpanded ? index === comments.length - 1 : index === displayedComments.length - 1) && !hasMore}
                        hasConnector={!(isExpanded ? index === comments.length - 1 : index === displayedComments.length - 1) || hasMore}
                    />
                ))}

                {isExpanded && hasMore && (
                    <div className="py-6 flex justify-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={isLoading}
                            onClick={() => fetchMore(false)}
                            className="text-primary font-bold hover:bg-primary/10 rounded-full h-10 px-6"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Show more replies"
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {!isExpanded && comments.length > initialDisplayCount && (
                <div className="flex justify-center py-6 border-t border-slate-100 dark:border-white/[0.05]">
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="text-[15px] font-bold text-primary hover:underline transition-all"
                    >
                        View more comments
                    </button>
                </div>
            )}

            {isLoading && comments.length > 0 && !isExpanded && (
                <div className="p-8 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            )}
        </div>
    );
}
