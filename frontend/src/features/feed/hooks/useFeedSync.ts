import { useEffect } from 'react';
import { useFeedStore } from '../store/feed.store';

export const useFeedSync = () => {
    const { updatePostStats } = useFeedStore();

    useEffect(() => {
        const channel = new BroadcastChannel('feed_sync');

        channel.onmessage = (event) => {
            const { type, payload } = event.data;
            if (type === 'POST_STATS_UPDATE') {
                updatePostStats(payload.postId, payload.stats);
            }
        };

        return () => channel.close();
    }, [updatePostStats]);

    const syncUpdate = (postId: string, stats: any) => {
        const channel = new BroadcastChannel('feed_sync');
        channel.postMessage({
            type: 'POST_STATS_UPDATE',
            payload: { postId, stats }
        });
        channel.close();
    };

    return { syncUpdate };
};
