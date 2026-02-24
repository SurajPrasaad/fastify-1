"use client"

import * as React from "react"
import { useInfiniteComments } from "@/features/comments/hooks"
import { Comment } from "@/features/interaction/types"
import { Loader2, MessageCircle, AlertCircle, RefreshCcw } from "lucide-react"
import { ReplyItem, Reply } from "@/components/thread/reply-item"
import { Button } from "@/components/ui/button"

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
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm text-muted-foreground animate-pulse">Fetching comments...</p>
            </div>
        );
    }

    if (!isLoading && comments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-900 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <h3 className="text-lg font-bold">No comments yet</h3>
                <p className="text-muted-foreground text-sm max-w-[250px]">
                    Be the first to share your thoughts on this post!
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800 transition-all">
                {comments.map((comment, index) => (
                    <ReplyItem
                        key={comment.id}
                        reply={mapCommentToReply(comment)}
                        postId={postId}
                        isLast={index === comments.length - 1 && !hasMore}
                        hasConnector={index !== comments.length - 1 || hasMore}
                    />
                ))}
            </div>

            {hasMore && (
                <div className="p-4 flex justify-center border-t border-gray-100 dark:divide-gray-800">
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={isLoading}
                        onClick={() => fetchMore(false)}
                        className="text-blue-500 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full h-10 px-6"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Loading...
                            </>
                        ) : (
                            "Show more comments"
                        )}
                    </Button>
                </div>
            )}

            {isLoading && comments.length > 0 && (
                <div className="p-8 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
            )}
        </div>
    );
}
