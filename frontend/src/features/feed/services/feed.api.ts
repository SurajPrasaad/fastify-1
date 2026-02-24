import { api } from "@/lib/api-client";
import { FeedParams, HashtagFeedParams } from "../types/feed.types";
import { FeedResponse } from "@/features/shared/types";

const buildQueryString = (params: Record<string, any>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            query.set(key, String(value));
        }
    });
    const qs = query.toString();
    return qs ? `?${qs}` : "";
};

export const feedApi = {
    /**
     * Fetch Home Feed (Hybrid ranking)
     */
    async getHomeFeed(params: FeedParams): Promise<FeedResponse> {
        return api.get<FeedResponse>(`/feed${buildQueryString(params)}`);
    },

    /**
     * Fetch Explore Feed (Trending + Discover)
     */
    async getExploreFeed(params: FeedParams): Promise<FeedResponse> {
        return api.get<FeedResponse>(`/feed/explore${buildQueryString(params)}`);
    },

    /**
     * Fetch Hashtag Feed
     */
    async getHashtagFeed(params: HashtagFeedParams): Promise<FeedResponse> {
        const { tag, ...rest } = params;
        return api.get<FeedResponse>(`/feed/hashtag/${tag}${buildQueryString(rest)}`);
    },

    /**
     * Like a post (Toggle)
     */
    async likePost(postId: string) {
        return api.post(`/interaction/like`, { resourceId: postId, resourceType: "POST" });
    },

    /**
     * Unlike a post (Toggle - same endpoint)
     */
    async unlikePost(postId: string) {
        return api.post(`/interaction/like`, { resourceId: postId, resourceType: "POST" });
    },

    /**
     * Bookmark a post (Toggle)
     */
    async bookmarkPost(postId: string) {
        return api.post(`/interaction/bookmark/${postId}`, {});
    },

    /**
     * Remove bookmark (Toggle - same endpoint)
     */
    async unbookmarkPost(postId: string) {
        return api.post(`/interaction/bookmark/${postId}`, {});
    },

    /**
     * Repost or quote a post
     */
    async repost(postId: string, content?: string) {
        return api.post(`/interaction/repost`, { postId, content });
    }
};
