import { useState, useCallback, useRef, useEffect } from "react";
import { Post, PaginatedResult } from "./types";
import { getMyPosts } from "./api";
import { toast } from "sonner";

export const useUserPosts = (initialData?: PaginatedResult<Post>) => {
    const [posts, setPosts] = useState<Post[]>(initialData?.data || []);
    const [nextCursor, setNextCursor] = useState<string | null>(initialData?.meta.nextCursor || null);
    const [hasNext, setHasNext] = useState<boolean>(initialData?.meta.hasNext ?? true);

    // Start loading immediately if no initial data is provided
    const [isLoading, setIsLoading] = useState(!initialData);
    const [error, setError] = useState<string | null>(null);

    const isFetchingRef = useRef(false);

    const fetchMore = useCallback(async () => {
        if (isFetchingRef.current || (!hasNext && !isLoading)) return;
        if (isLoading && posts.length > 0) return;

        setIsLoading(true);
        isFetchingRef.current = true;
        setError(null);

        try {
            const result = await getMyPosts(10, nextCursor || undefined);
            setPosts(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const uniqueNewPosts = result.data.filter(p => !existingIds.has(p.id));
                return [...prev, ...uniqueNewPosts];
            });
            setNextCursor(result.meta.nextCursor);
            setHasNext(result.meta.hasNext);
        } catch (err: any) {
            setError(err.message || "Failed to fetch posts");
            toast.error("Failed to load more posts");
        } finally {
            setIsLoading(false);
            isFetchingRef.current = false;
        }
    }, [nextCursor, hasNext, isLoading, posts.length]);

    // Initial fetch on mount
    useEffect(() => {
        if (!initialData) {
            fetchMore();
        }
    }, []);

    // Optimistic Update Helpers
    const addOptimisticPost = useCallback((newPost: Post) => {
        setPosts(prev => [newPost, ...prev]);
    }, []);

    const removePost = useCallback((postId: string) => {
        setPosts(prev => prev.filter(p => p.id !== postId));
    }, []);

    const updatePost = useCallback((postId: string, updatedData: Partial<Post>) => {
        setPosts(prev => prev.map(p =>
            p.id === postId ? { ...p, ...updatedData } : p
        ));
    }, []);

    return {
        posts,
        isLoading,
        hasNext,
        error,
        fetchMore,
        addOptimisticPost,
        removePost,
        updatePost
    };
};
