"use client";

import { PostCard, Post } from "@/components/feed/post-card";
import { useQueryClient } from "@tanstack/react-query";
import { PaginatedResult } from "@/features/posts/types";

// We use the useQueryClient directly or the hook we created.
// To avoid circular dependency or import issues if export/import isn't clear, we can inline or import.
// Using defined hook is better.
import { useUserLikedPosts } from "../hooks";

interface LikedPostCardProps {
    post: Post;
}

export function LikedPostCard({ post }: LikedPostCardProps) {
    const queryClient = useQueryClient();

    const handleLikeToggle = (isLiked: boolean) => {
        if (!isLiked) {
            // Optimistically remove from the list
            queryClient.setQueryData<{ pages: PaginatedResult<Post>[]; pageParams: any[] }>(
                ["my-liked-posts"],
                (oldData) => {
                    if (!oldData) return oldData;

                    return {
                        ...oldData,
                        pages: oldData.pages.map((page) => ({
                            ...page,
                            data: page.data.filter((p) => p.id !== post.id),
                        })),
                    };
                }
            );
        }
    };

    return (
        <PostCard
            post={post}
            onLikeToggle={handleLikeToggle}
        />
    );
}
