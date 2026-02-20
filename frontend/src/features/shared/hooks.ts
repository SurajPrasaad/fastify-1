
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FeedService, EngagementService, InteractionService } from '../shared/services';
import { useFeedStore, useEngagementStore, useCommentStore } from './stores';
import { ResourceType, IPost, IComment } from '../shared/types';
import { toast } from 'sonner';

export function useHomeFeed() {
    const { appendPosts, setPosts } = useFeedStore();

    return useInfiniteQuery({
        queryKey: ['feed', 'home'],
        queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
            const res = await FeedService.fetchHomeFeed(20, pageParam);
            if (!pageParam) {
                setPosts(res.data, res.hasMore, res.nextCursor);
            } else {
                appendPosts(res.data, res.hasMore, res.nextCursor);
            }
            return res;
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    });
}

export function useEngagement(targetId: string, initialData?: IPost | IComment) {
    const queryClient = useQueryClient();
    const { updatePostInteraction } = useFeedStore();

    const toggleLike = useMutation({
        mutationFn: (targetType: ResourceType) => EngagementService.toggleLike(targetId, targetType),
        onMutate: async (targetType) => {
            // Optimistic Update
            const previousPost = queryClient.getQueryData(['post', targetId]);

            if (targetType === ResourceType.POST) {
                updatePostInteraction(targetId, {
                    isLiked: true, // simplified for optimistic
                    stats: { /* ... existing stats ... */ } as any
                });
            }

            return { previousPost };
        },
        onError: (err, variables, context) => {
            toast.error('Failed to like');
            if (context?.previousPost) {
                queryClient.setQueryData(['post', targetId], context.previousPost);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['engagement', targetId] });
        }
    });

    const toggleBookmark = useMutation({
        mutationFn: () => EngagementService.toggleBookmark(targetId),
        onSuccess: (res) => {
            updatePostInteraction(targetId, { isBookmarked: res.isBookmarked });
        }
    });

    return { toggleLike, toggleBookmark };
}

export function useComments(postId: string) {
    const queryClient = useQueryClient();
    const { addComment } = useCommentStore();

    const commentsQuery = useInfiniteQuery({
        queryKey: ['comments', postId],
        queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
            InteractionService.fetchComments(postId, 20, pageParam),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

    const createComment = useMutation({
        mutationFn: ({ content, parentId }: { content: string; parentId?: string }) =>
            InteractionService.addComment(postId, content, parentId),
        onSuccess: (newComment) => {
            addComment(postId, newComment);
            queryClient.invalidateQueries({ queryKey: ['comments', postId] });
            toast.success('Comment added');
        }
    });

    return { commentsQuery, createComment };
}
