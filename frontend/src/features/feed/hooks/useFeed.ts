import { useFeedStore } from '../store/feed.store';
import { feedApi } from '../services/feed.api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FeedPost } from '../types/feed.types';
import { useFeedSync } from './useFeedSync';

export const useFeed = () => {
    const queryClient = useQueryClient();
    const { updatePostStats } = useFeedStore();
    const { syncUpdate } = useFeedSync();

    const likeMutation = useMutation({
        mutationFn: (postId: string) => feedApi.likePost(postId),
        onMutate: async (postId) => {
            // Optimistic update
            updatePostStats(postId, { isLiked: true });
            syncUpdate(postId, { isLiked: true });
        },
        onError: (_err, postId) => {
            updatePostStats(postId, { isLiked: false });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['feed'] });
        }
    });

    const unlikeMutation = useMutation({
        mutationFn: (postId: string) => feedApi.unlikePost(postId),
        onMutate: async (postId) => {
            updatePostStats(postId, { isLiked: false });
            syncUpdate(postId, { isLiked: false });
        },
        onError: (_err, postId) => {
            updatePostStats(postId, { isLiked: true });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['feed'] });
        }
    });

    const bookmarkMutation = useMutation({
        mutationFn: (postId: string) => feedApi.bookmarkPost(postId),
        onMutate: async (postId) => {
            updatePostStats(postId, { isBookmarked: true });
        },
        onError: (_err, postId) => {
            updatePostStats(postId, { isBookmarked: false });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['feed'] });
        }
    });

    const unbookmarkMutation = useMutation({
        mutationFn: (postId: string) => feedApi.unbookmarkPost(postId),
        onMutate: async (postId) => {
            updatePostStats(postId, { isBookmarked: false });
        },
        onError: (_err, postId) => {
            updatePostStats(postId, { isBookmarked: true });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['feed'] });
        }
    });

    const repostMutation = useMutation({
        mutationFn: ({ postId, content }: { postId: string, content?: string }) => feedApi.repost(postId, content),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feed'] });
            // We could also prepend the new post if the API returns it
        }
    });

    return {
        like: (postId: string) => likeMutation.mutate(postId),
        unlike: (postId: string) => unlikeMutation.mutate(postId),
        bookmark: (postId: string) => bookmarkMutation.mutate(postId),
        unbookmark: (postId: string) => unbookmarkMutation.mutate(postId),
        repost: (postId: string, content?: string) => repostMutation.mutate({ postId, content }),
    };
};
