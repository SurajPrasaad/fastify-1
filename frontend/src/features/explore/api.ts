import { api } from "@/lib/api-client";
import type {
    ExploreFeedResponse,
    TrendingHashtagsResponse,
    CreatorsResponse,
    SearchResponse,
} from "./types";

export const exploreApi = {
    /**
     * Personalized "For You" explore feed
     */
    async getExploreFeed(params?: {
        cursor?: string;
        limit?: number;
        region?: string;
    }): Promise<ExploreFeedResponse> {
        const query = new URLSearchParams();
        if (params?.cursor) query.set("cursor", params.cursor);
        if (params?.limit) query.set("limit", params.limit.toString());
        if (params?.region) query.set("region", params.region);
        return api.get(`/explore?${query.toString()}`);
    },

    /**
     * Trending feed (global or regional)
     */
    async getTrendingFeed(params?: {
        cursor?: string;
        limit?: number;
        region?: string;
        timeWindow?: string;
    }): Promise<ExploreFeedResponse> {
        const query = new URLSearchParams();
        if (params?.cursor) query.set("cursor", params.cursor);
        if (params?.limit) query.set("limit", params.limit.toString());
        if (params?.region) query.set("region", params.region);
        if (params?.timeWindow) query.set("timeWindow", params.timeWindow);
        return api.get(`/explore/trending?${query.toString()}`);
    },

    /**
     * Category-based discovery
     */
    async getCategoryFeed(
        slug: string,
        params?: { cursor?: string; limit?: number }
    ): Promise<ExploreFeedResponse> {
        const query = new URLSearchParams();
        if (params?.cursor) query.set("cursor", params.cursor);
        if (params?.limit) query.set("limit", params.limit.toString());
        return api.get(`/explore/category/${slug}?${query.toString()}`);
    },

    /**
     * Search posts, users, or hashtags
     */
    async search(params: {
        q: string;
        type?: string;
        cursor?: string;
        limit?: number;
    }): Promise<SearchResponse> {
        const query = new URLSearchParams();
        query.set("q", params.q);
        if (params.type) query.set("type", params.type);
        if (params.cursor) query.set("cursor", params.cursor);
        if (params.limit) query.set("limit", params.limit.toString());
        return api.get(`/explore/search?${query.toString()}`);
    },

    /**
     * Recommended creators to follow
     */
    async getCreators(params?: {
        limit?: number;
        category?: string;
    }): Promise<CreatorsResponse> {
        const query = new URLSearchParams();
        if (params?.limit) query.set("limit", params.limit.toString());
        if (params?.category) query.set("category", params.category);
        return api.get(`/explore/creators?${query.toString()}`);
    },

    /**
     * Trending hashtags
     */
    async getTrendingHashtags(params?: {
        limit?: number;
        region?: string;
    }): Promise<TrendingHashtagsResponse> {
        const query = new URLSearchParams();
        if (params?.limit) query.set("limit", params.limit.toString());
        if (params?.region) query.set("region", params.region);
        return api.get(`/explore/hashtags/trending?${query.toString()}`);
    },

    /**
     * Track user interaction for personalization
     */
    async trackInteraction(data: {
        postId: string;
        action: "VIEW" | "LIKE" | "SHARE" | "SAVE" | "NOT_INTERESTED";
        duration?: number;
    }): Promise<{ success: boolean }> {
        return api.post("/explore/interaction", data);
    },
};
