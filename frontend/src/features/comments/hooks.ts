import { useState, useCallback, useEffect } from "react";
import { commentApi } from "./api";
import { Comment } from "../interaction/types";

export function useInfiniteComments(postId: string, initialComments: Comment[] = []) {
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMore = useCallback(async (isInitial = false) => {
        if (isLoading) return;
        if (!isInitial && !hasMore) return;

        setIsLoading(true);
        setError(null);
        try {
            const cursor = !isInitial && comments.length > 0
                ? comments[comments.length - 1].createdAt
                : undefined;

            const nextComments = await commentApi.getPostComments(postId, cursor);

            if (nextComments.length === 0) {
                setHasMore(false);
            } else {
                setComments(prev => isInitial ? nextComments : [...prev, ...nextComments]);
                // If we got fewer than 20, we probably reached the end
                if (nextComments.length < 20) {
                    setHasMore(false);
                }
            }
        } catch (err: any) {
            console.error("Failed to fetch comments:", err);
            setError(err.message || "Failed to load comments");
        } finally {
            setIsLoading(false);
        }
    }, [postId, comments.length, isLoading, hasMore]);

    // Initial fetch on mount or postId change
    useEffect(() => {
        setComments([]);
        setHasMore(true);
        fetchMore(true);
    }, [postId]);

    const addComment = useCallback((newComment: Comment) => {
        setComments(prev => [newComment, ...prev]);
    }, []);

    return { comments, isLoading, hasMore, fetchMore, addComment, error };
}
