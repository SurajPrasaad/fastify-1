
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useComments } from '../shared/hooks';
import { formatDistanceToNow } from 'date-fns';
import { Heart, Reply, MoreHorizontal, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

export function CommentSection({ postId }: { postId: string }) {
    const { commentsQuery, createComment } = useComments(postId);
    const [newComment, setNewComment] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        createComment.mutate({ content: newComment });
        setNewComment('');
    };

    const comments = commentsQuery.data?.pages.flatMap(p => p.data) || [];

    return (
        <div className="flex flex-col h-full bg-background rounded-t-3xl border-t shadow-2xl overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-bold">Comments</h3>
                <span className="text-xs text-muted-foreground">{comments.length} items</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {commentsQuery.isLoading ? (
                    <CommentSkeleton />
                ) : comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                        <p className="text-sm">No comments yet. Be the first!</p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <CommentItem key={comment.id} comment={comment} />
                    ))
                )}

                {commentsQuery.hasNextPage && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => commentsQuery.fetchNextPage()}
                    >
                        Load more comments
                    </Button>
                )}
            </div>

            <div className="p-4 bg-card/50 border-t backdrop-blur-md">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 bg-background"
                    />
                    <Button type="submit" size="icon" disabled={createComment.isPending}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}

function CommentItem({ comment }: { comment: any }) {
    return (
        <div className="flex gap-3 group">
            <Avatar className="h-8 w-8">
                <AvatarImage src={comment.user.avatarUrl} />
                <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="bg-muted/50 rounded-2xl px-3 py-2">
                    <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-xs">{comment.user.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt))}
                        </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                </div>
                <div className="flex items-center gap-4 mt-1 ml-2">
                    <button className="text-[10px] font-semibold text-muted-foreground hover:text-primary">Like</button>
                    <button className="text-[10px] font-semibold text-muted-foreground hover:text-primary">Reply</button>
                </div>
            </div>
        </div>
    );
}

function CommentSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full rounded-2xl" />
                    </div>
                </div>
            ))}
        </div>
    );
}
