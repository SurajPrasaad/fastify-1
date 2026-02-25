
// ─── Explore Domain Types ─────────────────────────────────────────────────────

export interface ExplorePost {
    id: string;
    userId: string;
    content: string;
    mediaUrls: string[];
    tags: string[];
    originalPostId?: string | null;
    createdAt: string;
    updatedAt: string;
    publishedAt: string | null;
    likesCount: number;
    commentsCount: number;
    repostsCount: number;
    author: {
        id: string;
        username: string;
        name: string;
        avatarUrl: string | null;
    };
    isLiked?: boolean;
    isBookmarked?: boolean;
    rankScore: number;
    source: string;
}

export interface ExploreFeedResponse {
    posts: ExplorePost[];
    nextCursor: string | null;
    hasMore: boolean;
    meta: {
        count: number;
        provider: string;
        pools?: string[];
        region?: string;
        category?: string;
    };
}

export interface TrendingHashtag {
    id: string;
    name: string;
    postsCount: number;
    lastUsedAt: string;
}

export interface TrendingHashtagsResponse {
    data: TrendingHashtag[];
    meta: { count: number; provider: string };
}

export interface CreatorRecommendation {
    id: string;
    username: string;
    name: string;
    avatarUrl: string | null;
    bio: string | null;
    followersCount: number;
    postsCount: number;
}

export interface CreatorsResponse {
    data: CreatorRecommendation[];
    meta: { count: number; provider: string };
}

export interface SearchResponse {
    data: any[];
    nextCursor: string | null;
    hasMore: boolean;
    meta: { count: number; provider: string; type: string };
}

export type ExploreCategory =
    | "for-you"
    | "trending"
    | "ai"
    | "tech"
    | "design"
    | "startups"
    | "gaming"
    | "news"
    | "sports"
    | "music";

export interface CategoryTab {
    slug: ExploreCategory | string;
    label: string;
    icon: string;
}
