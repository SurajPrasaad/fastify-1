import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketService } from '@/services/socket.service';
import { useFeedStore } from '../store/feed.store';
import {
    RealtimeEngagementPayload,
    RealtimeNewPostPayload,
    RealtimeRebalancePayload
} from '../types/feed.types';

export const useRealtimeFeed = () => {
    const queryClient = useQueryClient();
    const { prependPost, updatePostStats, triggerRebalance } = useFeedStore();

    useEffect(() => {
        socketService.connect();

        // Listen for new posts
        const handleNewPost = (payload: RealtimeNewPostPayload) => {
            prependPost(payload.post);
            // Also invalidate queries to keep cache in sync
            queryClient.invalidateQueries({ queryKey: ['feed', 'home'] });
        };

        // Listen for engagement updates
        const handleEngagementUpdate = (payload: RealtimeEngagementPayload) => {
            updatePostStats(payload.postId, {
                likeCount: payload.likeCount,
                commentCount: payload.commentCount,
                repostCount: payload.repostCount
            });
        };

        // Listen for rebalance events
        const handleRebalance = (_payload: RealtimeRebalancePayload) => {
            triggerRebalance();
            queryClient.invalidateQueries({ queryKey: ['feed', 'home'] });
        };

        socketService.on('feed:new_post', handleNewPost);
        socketService.on('feed:engagement_update', handleEngagementUpdate);
        socketService.on('feed:rebalance', handleRebalance);

        return () => {
            socketService.off('feed:new_post', handleNewPost);
            socketService.off('feed:engagement_update', handleEngagementUpdate);
            socketService.off('feed:rebalance', handleRebalance);
        };
    }, [queryClient, prependPost, updatePostStats, triggerRebalance]);
};
