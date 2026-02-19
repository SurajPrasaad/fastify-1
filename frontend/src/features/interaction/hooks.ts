import { useState, useCallback } from "react";
import { interactionApi } from "./api";
import { ResourceType } from "./types";
import { toast } from "sonner";

/**
 * Hook for toggling likes with optimistic UI support.
 */
export function useToggleLike(initialLiked: boolean = false, initialCount: number = 0, onToggle?: (liked: boolean) => void) {
    const [isLiked, setIsLiked] = useState(initialLiked);
    const [count, setCount] = useState(initialCount);
    const [isPending, setIsPending] = useState(false);

    const toggleLike = useCallback(async (resourceId: string, resourceType: ResourceType) => {
        if (isPending) return;

        // Optimistic Update
        const prevLiked = isLiked;
        const prevCount = count;
        const newLiked = !prevLiked;

        setIsLiked(newLiked);
        setCount(c => prevLiked ? c - 1 : c + 1);
        setIsPending(true);
        onToggle?.(newLiked);

        try {
            const result = await interactionApi.toggleLike({ resourceId, resourceType });
            // Sync with server response just in case
            setIsLiked(result.liked);
            setCount(result.count);
        } catch (error) {
            // Rollback on failure
            setIsLiked(prevLiked);
            setCount(prevCount);
            onToggle?.(prevLiked); // Revert callback
            toast.error("Failed to update like");
        } finally {
            setIsPending(false);
        }
    }, [isLiked, count, isPending, onToggle]);

    return { isLiked, count, toggleLike, isPending };
}

/**
 * Hook for toggling bookmarks.
 */
export function useToggleBookmark(initialBookmarked: boolean = false) {
    const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
    const [isPending, setIsPending] = useState(false);

    const toggleBookmark = useCallback(async (postId: string) => {
        if (isPending) return;

        const prevBookmarked = isBookmarked;
        setIsBookmarked(!prevBookmarked);
        setIsPending(true);

        try {
            const result = await interactionApi.toggleBookmark(postId);
            setIsBookmarked(result.bookmarked);
            if (result.bookmarked) {
                toast.success("Added to bookmarks");
            }
        } catch (error) {
            setIsBookmarked(prevBookmarked);
            toast.error("Failed to update bookmark");
        } finally {
            setIsPending(false);
        }
    }, [isBookmarked, isPending]);

    return { isBookmarked, toggleBookmark, isPending };
}

/**
 * Hook for creating comments or replies.
 */
export function useCreateComment() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createComment = useCallback(async (
        postId: string,
        content: string,
        parentId?: string,
        onSuccess?: (comment: any) => void
    ) => {
        if (!content.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const newComment = await interactionApi.createComment({
                postId,
                content: content.trim(),
                parentId
            });

            toast.success(parentId ? "Reply added" : "Comment added");
            onSuccess?.(newComment);
            return newComment;
        } catch (error) {
            toast.error("Failed to post comment");
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting]);

    return { createComment, isSubmitting };
}
