"use client";

import * as React from "react";
import { useMyLikedPosts } from "@/features/likes/hooks";
import { LikedPostCard } from "@/features/likes/components/LikedPostCard";
import { Loader2, HeartOff, AlertCircle } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { Button } from "@/components/ui/button";

export default function ProfileLikesPage() {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
        refetch
    } = useMyLikedPosts();

    const { ref, inView } = useInView();

    React.useEffect(() => {
        if (inView && hasNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, fetchNextPage]);

    if (status === 'pending') {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-10 h-10 text-destructive mb-3" />
                <h3 className="text-lg font-semibold">Failed to load likes</h3>
                <Button variant="outline" onClick={() => refetch()} className="mt-4">
                    Try Again
                </Button>
            </div>
        );
    }

    // Check if we have any posts across all pages
    const hasPosts = data?.pages.some(page => page.data.length > 0);

    if (!hasPosts) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4 animate-in fade-in duration-500">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <HeartOff className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold">No likes yet</h3>
                <p className="text-muted-foreground mt-1 max-w-[280px]">
                    When you like posts, they will show up here.
                </p>
                <Button variant="outline" className="mt-6" asChild>
                    <a href="/active">Explore Posts</a>
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 pb-8 w-full animate-in fade-in duration-500">
            {data?.pages.map((page, i) => (
                <React.Fragment key={i}>
                    {page.data.map((post) => (
                        <LikedPostCard key={post.id} post={post} />
                    ))}
                </React.Fragment>
            ))}

            <div ref={ref} className="flex justify-center py-6 min-h-[60px]">
                {isFetchingNextPage ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : hasNextPage ? (
                    <div className="h-6" /> // Spacer for intersection observer
                ) : (
                    <p className="text-sm text-muted-foreground">You&apos;ve reached the end.</p>
                )}
            </div>
        </div>
    );
}
