
// ─── Explore DTOs ─────────────────────────────────────────────────────────────

export interface ExplorePost {
    id: string;
    userId: string;
    content: string;
    mediaUrls: string[];
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    publishedAt: Date | null;
    likesCount: number;
    commentsCount: number;
    repostsCount: number;
    author: {
        id: string;
        username: string;
        name: string;
        avatarUrl: string | null;
    };
    rankScore: number;
    source: CandidateSource;
    isLiked?: boolean;
    isBookmarked?: boolean;
}

export type CandidateSource =
    | "TRENDING"
    | "PERSONALIZED"
    | "CATEGORY"
    | "SEARCH"
    | "SERENDIPITY"
    | "COLD_START"
    | "FALLBACK";

export interface ExploreCandidate {
    postId: string;
    score: number;
    source: CandidateSource;
}

export interface CandidatePool {
    source: CandidateSource;
    candidates: ExploreCandidate[];
}

export interface RankingWeights {
    engagement: number;
    freshness: number;
    personalization: number;
    quality: number;
    diversity: number;
}

export interface DiversityConfig {
    maxPerAuthor: number;
    maxCategoryRatio: number;
    pageSize: number;
}

export interface ExploreCursor {
    s: number;   // last score
    t: number;   // timestamp epoch ms
    id: string;  // last post ID
}

export interface TrendingHashtag {
    id: string;
    name: string;
    postsCount: number;
    velocity: number;
    lastUsedAt: Date;
}

export interface CreatorRecommendation {
    id: string;
    username: string;
    name: string;
    avatarUrl: string | null;
    bio: string | null;
    followersCount: number;
    postsCount: number;
    affinityScore: number;
}

export interface ContentFlags {
    spamScore: number;
    nsfwScore: number;
    toxicityScore: number;
    botScore: number;
    qualityScore: number;
    reviewStatus: "AUTO_APPROVED" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "SHADOW_BANNED";
}
