import { api } from "./api-client";

export interface FeedParams {
    page?: number;
    limit?: number;
    type?: 'FOR_YOU' | 'FOLLOWING' | 'explore' | 'hashtag';
    tag?: string;
    cursor?: string;
}

export interface FeedResponse {
    data: any[];
    posts?: any[];
    nextCursor: string | null;
    hasMore: boolean;
    meta: {
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
        hasNextPage?: boolean;
        count?: number;
    };
}

const buildQueryString = (params: Record<string, any>) => {
    const queryParts: string[] = [];
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
        }
    });
    return queryParts.length > 0 ? `?${queryParts.join('&')}` : "";
};

export const FeedApi = {
    async getHomeFeed(params: FeedParams): Promise<FeedResponse> {
        return api.get<FeedResponse>(`/feed${buildQueryString(params)}`);
    },

    async getExploreFeed(params: FeedParams): Promise<FeedResponse> {
        // Use the new explore module endpoint for a richer experience
        return api.get<FeedResponse>(`/explore${buildQueryString(params)}`);
    },

    async getHashtagFeed(params: { tag: string } & FeedParams): Promise<FeedResponse> {
        const { tag, ...rest } = params;
        return api.get<FeedResponse>(`/feed/hashtag/${tag}${buildQueryString(rest)}`);
    },

    async getTrendingHashtags(limit: number = 10) {
        return api.get<{ data: any[]; meta: any }>(`/explore/hashtags/trending?limit=${limit}`);
    },

    async getRecommendedCreators(limit: number = 5) {
        return api.get<{ data: any[]; meta: any }>(`/explore/creators?limit=${limit}`);
    },

    async search(params: { q: string; type?: 'posts' | 'users' | 'hashtags'; limit?: number; cursor?: string }) {
        return api.get<FeedResponse>(`/explore/search${buildQueryString(params)}`);
    },

    async likePost(postId: string) {
        return api.post(`/interaction/like`, { resourceId: postId, resourceType: "POST" });
    },

    async bookmarkPost(postId: string) {
        return api.post(`/interaction/bookmark/${postId}`, {});
    },

    async getRepost(postId: string, content?: string) {
        return api.post(`/interaction/repost`, { postId, content });
    },

    async getBookmarks(params: { cursor?: string; limit?: number }) {
        const query = new URLSearchParams();
        if (params.cursor) query.set("cursor", params.cursor);
        if (params.limit) query.set("limit", String(params.limit));
        return api.get<{ data: any[]; meta: { nextCursor: string | null } }>(`/interaction/bookmarks?${query.toString()}`);
    }
};
