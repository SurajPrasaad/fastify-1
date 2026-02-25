"use client";

import * as React from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Loader2, Bookmark as BookmarkIcon } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { PostCard } from "@/components/feed/post-card";
import { useParams, useRouter } from "next/navigation";
import { useCurrentUser } from "@/features/auth/hooks";

// Re-using types from global bookmarks for consistency
interface BookmarkedPost {
    id: string;
    userId: string;
    content: string;
    mediaUrls: string[];
    likesCount: number;
    commentsCount: number;
    repostsCount: number;
    createdAt: string;
    publishedAt?: string;
    author: {
        username: string;
        name: string;
        avatarUrl: string | null;
        isVerified?: boolean;
    };
    isLiked: boolean;
    isBookmarked: boolean;
    bookmarkedAt: string;
}

interface BookmarksResponse {
    data: BookmarkedPost[];
    meta: { nextCursor: string | null; hasNext: boolean };
}

async function getBookmarks(cursor?: string, limit = 10): Promise<BookmarksResponse> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.set("cursor", cursor);
    return api.get(`/interaction/bookmarks?${params}`);
}

export default function ProfileBookmarksPage() {
    const { username } = useParams<{ username: string }>();
    const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();
    const router = useRouter();

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        refetch
    } = useInfiniteQuery({
        queryKey: ["bookmarks", currentUser?.id],
        queryFn: ({ pageParam }) => getBookmarks(pageParam),
        getNextPageParam: (lastPage) => lastPage.meta?.nextCursor ?? undefined,
        initialPageParam: undefined as string | undefined,
        enabled: !!currentUser && currentUser.username === username,
    });

    const { ref, inView } = useInView();

    React.useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Redirect if not the owner
    React.useEffect(() => {
        if (!isUserLoading && currentUser && currentUser.username !== username) {
            router.replace(`/${username}/posts`);
        }
    }, [currentUser, username, isUserLoading, router]);

    if (isUserLoading || isLoading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const allPosts = data?.pages.flatMap((p) => p.data) ?? [];

    if (allPosts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4 animate-in fade-in duration-500">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <BookmarkIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold">No bookmarks yet</h3>
                <p className="text-muted-foreground mt-1 max-w-[280px]">
                    When you bookmark a post, it will show up here for easy access later.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col divide-y divide-border/50 animate-in fade-in duration-500">
            {allPosts.map((post) => (
                <PostCard
                    key={post.id}
                    post={{
                        ...post,
                        author: {
                            ...post.author,
                            avatarUrl: post.author.avatarUrl || null,
                            isVerified: post.author.isVerified ?? false
                        },
                        status: "PUBLISHED",
                        updatedAt: post.createdAt, // approximation
                        mediaUrls: post.mediaUrls || [],
                    } as any}
                    onRemove={() => refetch()}
                />
            ))}

            <div ref={ref} className="py-8 flex justify-center">
                {isFetchingNextPage && <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />}
            </div>
        </div>
    );
}
