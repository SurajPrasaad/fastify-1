import { useState, useCallback } from "react";
import { commentApi } from "./api";
import { Comment } from "../interaction/types";

export function useInfiniteComments(postId: string, initialComments: Comment[] = []) {
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const fetchMore = useCallback(async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        try {
            const cursor = comments.length > 0 ? comments[comments.length - 1].createdAt : undefined;
            const nextComments = await commentApi.getPostComments(postId, cursor);

            if (nextComments.length === 0) {
                setHasMore(false);
            } else {
                setComments(prev => [...prev, ...nextComments]);
            }
        } finally {
            setIsLoading(false);
        }
    }, [postId, comments, isLoading, hasMore]);

    const addComment = useCallback((newComment: Comment) => {
        setComments(prev => [newComment, ...prev]);
    }, []);

    return { comments, isLoading, hasMore, fetchMore, addComment };
}
