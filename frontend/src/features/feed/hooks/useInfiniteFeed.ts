import { useInfiniteQuery } from '@tanstack/react-query';
import { feedApi } from '../services/feed.api';
import { FeedPost } from '../types/feed.types';
import { FeedResponse } from '@/features/shared/types';

export const useInfiniteFeed = (type: 'home' | 'explore' | 'hashtag', tag?: string) => {
    return useInfiniteQuery<FeedResponse, Error>({
        queryKey: ['feed', type, tag].filter(Boolean),
        queryFn: async ({ pageParam }) => {
            const cursor = pageParam as string | undefined;
            switch (type) {
                case 'home':
                    return feedApi.getHomeFeed({ cursor });
                case 'explore':
                    return feedApi.getExploreFeed({ cursor });
                case 'hashtag':
                    if (!tag) throw new Error('Tag is required for hashtag feed');
                    return feedApi.getHashtagFeed({ tag, cursor });
                default:
                    throw new Error('Invalid feed type');
            }
        },
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    });
};
