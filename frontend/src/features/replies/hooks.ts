import { useState, useCallback, useRef, useEffect } from "react";
import { Reply, PaginatedResult } from "./types";
import { getMyReplies, getUserReplies } from "./api";
import { toast } from "sonner";

export const useUserReplies = (username?: string, initialData?: PaginatedResult<Reply>) => {
    const [replies, setReplies] = useState<Reply[]>(initialData?.data || []);
    const [nextCursor, setNextCursor] = useState<string | null>(initialData?.meta.nextCursor || null);
    const [hasNext, setHasNext] = useState<boolean>(initialData?.meta.hasNext ?? true);

    // Start loading immediately if no initial data is provided to prevent empty state flash
    const [isLoading, setIsLoading] = useState(!initialData);
    const [error, setError] = useState<string | null>(null);

    const isFetchingRef = useRef(false);

    const fetchMore = useCallback(async () => {
        if (isFetchingRef.current || (!hasNext && !isLoading)) return;

        // Prevent duplicate calls if already loading, unless it's the specific initial load state
        if (isLoading && replies.length > 0) return;

        setIsLoading(true);
        isFetchingRef.current = true;
        setError(null);

        try {
            const result = username
                ? await getUserReplies(username, 10, nextCursor || undefined)
                : await getMyReplies(10, nextCursor || undefined);

            setReplies(prev => {
                // Deduplicate items based on ID
                const existingIds = new Set(prev.map(r => r.id));
                const uniqueNewReplies = result.data.filter(r => !existingIds.has(r.id));
                return [...prev, ...uniqueNewReplies];
            });
            setNextCursor(result.meta.nextCursor);
            setHasNext(result.meta.hasNext);
        } catch (err: any) {
            setError(err.message || "Failed to fetch replies");
            toast.error("Failed to load replies");
        } finally {
            setIsLoading(false);
            isFetchingRef.current = false;
        }
    }, [nextCursor, hasNext, isLoading, replies.length, username]);

    // Initial fetch on mount
    useEffect(() => {
        if (!initialData) {
            fetchMore();
        }
    }, []); // Run once on mount

    // Optimistic Update Helper
    const addOptimisticReply = useCallback((newReply: Reply) => {
        setReplies(prev => [newReply, ...prev]);
    }, []);


    return {
        replies,
        isLoading,
        hasNext,
        error,
        fetchMore,
        addOptimisticReply
    };
};
