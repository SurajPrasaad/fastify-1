import { IPost, PaginatedResponse } from '@/features/shared/types';

export interface FeedPost extends IPost {
    rebalanceScore?: number;
    isAd?: boolean;
    hashtags?: string[];
}

export interface FeedParams {
    limit?: number;
    cursor?: string;
    type?: 'FOR_YOU' | 'FOLLOWING';
}

export interface HashtagFeedParams extends FeedParams {
    tag: string;
}

export interface FeedStoreState {
    posts: FeedPost[];
    cursor: string | null;
    hasMore: boolean;
    isLoading: boolean;
    error: string | null;
    refreshing: boolean;
    rebalanceTrigger: number;

    setPosts: (posts: FeedPost[]) => void;
    addPosts: (posts: FeedPost[]) => void;
    prependPost: (post: FeedPost) => void;
    updatePostStats: (postId: string, stats: Partial<FeedPost['stats']>) => void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    setRefreshing: (refreshing: boolean) => void;
    triggerRebalance: () => void;
    reset: () => void;
}

export interface RealtimeEngagementPayload {
    postId: string;
    likeCount: number;
    commentCount: number;
    repostCount: number;
}

export interface RealtimeNewPostPayload {
    post: FeedPost;
}

export interface RealtimeRebalancePayload {
    postIds: string[];
}
