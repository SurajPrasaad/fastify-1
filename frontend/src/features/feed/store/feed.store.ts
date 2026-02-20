import { create } from 'zustand';
import { FeedStoreState, FeedPost } from '../types/feed.types';

export const useFeedStore = create<FeedStoreState>((set) => ({
    posts: [],
    cursor: null,
    hasMore: true,
    isLoading: false,
    error: null,
    refreshing: false,
    rebalanceTrigger: 0,

    setPosts: (posts: FeedPost[]) => set({
        posts,
        cursor: posts.length > 0 ? posts[posts.length - 1].createdAt : null
    }),

    addPosts: (newPosts: FeedPost[]) => set((state) => {
        // Deduplicate
        const existingIds = new Set(state.posts.map(p => p.id));
        const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));

        const merged = [...state.posts, ...uniqueNewPosts];
        return {
            posts: merged,
            cursor: merged.length > 0 ? merged[merged.length - 1].createdAt : null,
            hasMore: newPosts.length > 0
        };
    }),

    prependPost: (post: FeedPost) => set((state) => {
        if (state.posts.some(p => p.id === post.id)) return state;
        return { posts: [post, ...state.posts] };
    }),

    updatePostStats: (postId: string, stats: Partial<FeedPost['stats']>) => set((state) => ({
        posts: state.posts.map((p) =>
            p.id === postId ? { ...p, stats: { ...p.stats, ...stats } } : p
        )
    })),

    setLoading: (isLoading: boolean) => set({ isLoading }),
    setError: (error: string | null) => set({ error }),
    setRefreshing: (refreshing: boolean) => set({ refreshing }),
    triggerRebalance: () => set((state) => ({ rebalanceTrigger: state.rebalanceTrigger + 1 })),

    reset: () => set({
        posts: [],
        cursor: null,
        hasMore: true,
        isLoading: false,
        error: null,
        refreshing: false
    })
}));
