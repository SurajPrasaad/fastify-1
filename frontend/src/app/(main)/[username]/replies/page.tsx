"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useUserReplies } from "@/features/replies/hooks";
import { ReplyCard } from "@/features/replies/components/ReplyCard";
import { Loader2, MessageSquareOff } from "lucide-react";
import { useInView } from "react-intersection-observer";

export default function ProfileRepliesPage() {
    const { username } = useParams<{ username: string }>();
    const { replies, isLoading, hasNext, fetchMore, error } = useUserReplies(username);
    const { ref, inView } = useInView({
        threshold: 0,
    });

    // Infinite Scroll Logic
    React.useEffect(() => {
        if (inView && hasNext && !isLoading) {
            fetchMore();
        }
    }, [inView, hasNext, isLoading, fetchMore]);

    if (!isLoading && replies.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-20 h-20 rounded-full bg-accent/50 flex items-center justify-center mb-6">
                    <MessageSquareOff className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight">No replies yet</h3>
                <p className="text-muted-foreground mt-2 max-w-sm text-lg">
                    When you reply to posts, they will show up here for you to track your conversations.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col mb-20 animate-in fade-in duration-700">
            <div className="divide-y divide-border/20">
                {replies.map((reply, index) => (
                    <ReplyCard
                        key={reply.id}
                        reply={reply}
                        isLast={index === replies.length - 1}
                    />
                ))}
            </div>

            {/* Loading / Infinite Scroll Target */}
            <div ref={ref} className="py-8 flex justify-center">
                {isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-medium">Loading more replies...</span>
                    </div>
                )}
                {!hasNext && replies.length > 0 && (
                    <p className="text-muted-foreground text-sm font-medium py-4">
                        You&apos;ve reached the end of your replies.
                    </p>
                )}
            </div>

            {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl mx-4 text-center">
                    <p className="text-destructive font-medium">{error}</p>
                    <button
                        onClick={() => fetchMore()}
                        className="mt-2 text-sm text-primary hover:underline"
                    >
                        Try again
                    </button>
                </div>
            )}
        </div>
    );
}
