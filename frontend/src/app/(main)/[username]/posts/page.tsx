"use client";

import * as React from "react";
import { useUserPosts } from "@/features/posts/hooks";
import { PostCard } from "@/components/feed/post-card";
import { Loader2, PenSquare } from "lucide-react";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";

export default function ProfilePostsPage() {
    const { username } = useParams<{ username: string }>();
    const { posts, isLoading, hasNext, fetchMore, removePost, updatePost, error } = useUserPosts(username);
    const { ref, inView } = useInView({
        threshold: 0,
    });

    React.useEffect(() => {
        if (inView && hasNext && !isLoading) {
            fetchMore();
        }
    }, [inView, hasNext, isLoading, fetchMore]);

    if (!isLoading && posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-20 h-20 rounded-full bg-accent/50 flex items-center justify-center mb-6">
                    <PenSquare className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight">No posts yet</h3>
                <p className="text-muted-foreground mt-2 max-w-sm text-lg">
                    Share your thoughts with the world!
                </p>
                <Link href="/" className="mt-6">
                    <Button>Create your first post</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col mb-20 space-y-4 animate-in fade-in duration-700">
            {posts.map((post) => (
                <PostCard
                    key={post.id}
                    post={post as any} // Cast if minor type mismatch from different files
                    onRemove={removePost}
                    onUpdate={updatePost as any}
                />
            ))}

            <div ref={ref} className="py-8 flex justify-center">
                {isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-medium">Loading posts...</span>
                    </div>
                )}
                {!hasNext && posts.length > 0 && (
                    <p className="text-muted-foreground text-sm font-medium py-4">
                        You&apos;ve reached the end of your posts.
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
