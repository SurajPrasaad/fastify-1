
import { create } from 'zustand';
import { IPost, IComment, IEngagementStats } from '../shared/types';

interface FeedState {
    posts: IPost[];
    cursor?: string;
    hasMore: boolean;
    setPosts: (posts: IPost[], hasMore: boolean, cursor?: string) => void;
    appendPosts: (posts: IPost[], hasMore: boolean, cursor?: string) => void;
    updatePostStats: (postId: string, stats: Partial<IEngagementStats>) => void;
    updatePostInteraction: (postId: string, updates: Partial<IPost>) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
    posts: [],
    hasMore: true,
    setPosts: (posts, hasMore, cursor) => set({ posts, hasMore, cursor }),
    appendPosts: (newPosts, hasMore, cursor) => set((state) => {
        // Deduplication
        const existingIds = new Set(state.posts.map(p => p.id));
        const filteredNewPosts = newPosts.filter(p => !existingIds.has(p.id));
        return {
            posts: [...state.posts, ...filteredNewPosts],
            hasMore,
            cursor
        };
    }),
    updatePostStats: (postId, stats) => set((state) => ({
        posts: state.posts.map(p => p.id === postId ? { ...p, stats: { ...p.stats, ...stats } } : p)
    })),
    updatePostInteraction: (postId, updates) => set((state) => ({
        posts: state.posts.map(p => p.id === postId ? { ...p, ...updates } : p)
    }))
}));

interface EngagementState {
    statsMap: Record<string, IEngagementStats>;
    setStats: (targetId: string, stats: IEngagementStats) => void;
    optimisticUpdate: (targetId: string, updates: Partial<IEngagementStats> & { isLiked?: boolean; isBookmarked?: boolean }) => void;
}

export const useEngagementStore = create<EngagementState>((set) => ({
    statsMap: {},
    setStats: (targetId, stats) => set((state) => ({
        statsMap: { ...state.statsMap, [targetId]: stats }
    })),
    optimisticUpdate: (targetId, updates) => set((state) => ({
        statsMap: {
            ...state.statsMap,
            [targetId]: { ...state.statsMap[targetId], ...updates } as IEngagementStats
        }
    }))
}));

interface CommentState {
    commentsByPost: Record<string, IComment[]>;
    repliesByComment: Record<string, IComment[]>;
    setComments: (postId: string, comments: IComment[]) => void;
    addComment: (postId: string, comment: IComment) => void;
    addReply: (commentId: string, reply: IComment) => void;
}

export const useCommentStore = create<CommentState>((set) => ({
    commentsByPost: {},
    repliesByComment: {},
    setComments: (postId, comments) => set((state) => ({
        commentsByPost: { ...state.commentsByPost, [postId]: comments }
    })),
    addComment: (postId, comment) => set((state) => ({
        commentsByPost: {
            ...state.commentsByPost,
            [postId]: [comment, ...(state.commentsByPost[postId] || [])]
        }
    })),
    addReply: (commentId, reply) => set((state) => ({
        repliesByComment: {
            ...state.repliesByComment,
            [commentId]: [...(state.repliesByComment[commentId] || []), reply]
        }
    }))
}));
