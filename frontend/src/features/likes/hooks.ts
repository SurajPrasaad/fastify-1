
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { getMyLikedPosts } from "./api";
import { Post, PaginatedResult } from "../posts/types";

export const useMyLikedPosts = () => {
    return useInfiniteQuery({
        queryKey: ["my-liked-posts"],
        queryFn: ({ pageParam }) => getMyLikedPosts(10, pageParam),
        getNextPageParam: (lastPage) => lastPage.meta.hasNext ? (lastPage.meta.nextCursor ?? undefined) : undefined,
        initialPageParam: undefined as string | undefined,
    });
};

export const useOptimisticUnlike = () => {
    const queryClient = useQueryClient();

    const handleUnlike = (postId: string) => {
        // Optimistically remove the post from the lists
        queryClient.setQueryData<{ pages: PaginatedResult<Post>[]; pageParams: any[] }>(
            ["my-liked-posts"],
            (oldData) => {
                if (!oldData) return oldData;

                return {
                    ...oldData,
                    pages: oldData.pages.map((page) => ({
                        ...page,
                        data: page.data.filter((post) => post.id !== postId),
                    })),
                };
            }
        );
    };

    return handleUnlike;
};
