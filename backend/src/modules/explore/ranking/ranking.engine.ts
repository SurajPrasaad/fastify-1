
import type { RankingWeights } from "../explore.dto.js";
import { DEFAULT_WEIGHTS, DECAY_CONFIG } from "./ranking.weights.js";

interface RankablePost {
    id: string;
    userId: string;
    tags: string[];
    likesCount: number;
    commentsCount: number;
    repostsCount: number;
    createdAt: Date;
    publishedAt: Date | null;
    [key: string]: any;
}

interface UserProfile {
    topicWeights: Record<string, number>;
    authorAffinities: Record<string, number>;
}

export interface ScoredPost extends RankablePost {
    rankScore: number;
    source: string;
}

/**
 * Ranking Engine
 * 
 * Computes a final ranking score for each candidate post using:
 * - Engagement velocity (likes, comments, reposts over time)
 * - Freshness decay (exponential time decay)
 * - Personalization similarity (topic + author affinity)
 * - Quality score (content quality / anti-spam)
 *
 * Formula:
 *   finalScore = (engagement_w * engagement) + (freshness_w * freshness)
 *              + (personalization_w * personalization) + (quality_w * quality)
 *              - (diversity_w * diversityPenalty)
 */
export class RankingEngine {
    private weights: RankingWeights;

    constructor(weights?: Partial<RankingWeights>) {
        this.weights = { ...DEFAULT_WEIGHTS, ...weights };
    }

    /**
     * Rank an array of candidate posts for a user.
     * Returns posts sorted by computed score descending.
     */
    rankPosts(
        candidates: RankablePost[],
        userProfile?: UserProfile,
        source: string = "TRENDING"
    ): ScoredPost[] {
        const scored = candidates.map(post => ({
            ...post,
            rankScore: this.computeScore(post, userProfile),
            source,
        }));

        return scored.sort((a, b) => b.rankScore - a.rankScore);
    }

    /**
     * Compute the ranking score for a single post.
     */
    computeScore(post: RankablePost, userProfile?: UserProfile): number {
        const engagement = this.engagementScore(post);
        const freshness = this.freshnessScore(post);
        const personalization = userProfile
            ? this.personalizationScore(post, userProfile)
            : 0;
        const quality = this.qualityScore(post);

        const finalScore =
            (this.weights.engagement * engagement) +
            (this.weights.freshness * freshness) +
            (this.weights.personalization * personalization) +
            (this.weights.quality * quality);

        return Math.max(0, finalScore);
    }

    /**
     * Engagement velocity: measures interaction rate relative to post age.
     * Higher velocity = more rapidly engaging content.
     * 
     * Formula: (likes + comments*2 + reposts*3) / (ageHours + 2)
     * Normalized to [0, 1] range.
     */
    private engagementScore(post: RankablePost): number {
        const ageHours = this.getAgeInHours(post);

        const rawInteractions =
            post.likesCount +
            (post.commentsCount * 2) +
            (post.repostsCount * 3);

        // Velocity: interactions per hour, with smoothing factor to prevent spike on new posts
        const velocity = rawInteractions / (ageHours + 2);

        // Normalize: 100 interactions/hour = score of 1.0
        return Math.min(velocity / 100, 1.0);
    }

    /**
     * Freshness: exponential decay based on post age.
     * Newer posts get higher freshness scores.
     * 
     * Uses configurable half-life (default 48h for explore).
     */
    private freshnessScore(post: RankablePost): number {
        const ageHours = this.getAgeInHours(post);
        return Math.exp(-ageHours / DECAY_CONFIG.explore);
    }

    /**
     * Personalization: how relevant is this post to the user's interests.
     * Based on topic overlap and author affinity.
     */
    private personalizationScore(post: RankablePost, userProfile: UserProfile): number {
        let score = 0;

        // Topic overlap: sum of user's interest weight for each matching tag
        if (post.tags && post.tags.length > 0) {
            const topicScore = post.tags.reduce((sum, tag) => {
                return sum + (userProfile.topicWeights[tag] || 0);
            }, 0);
            // Normalize topic score (assume max meaningful score ~50)
            score += Math.min(topicScore / 50, 1.0) * 0.6;
        }

        // Author affinity: how much the user interacts with this post's author
        const authorAffinity = userProfile.authorAffinities[post.userId] || 0;
        score += Math.min(authorAffinity / 30, 1.0) * 0.4;

        return Math.min(score, 1.0);
    }

    /**
     * Quality score: basic content quality estimation.
     * In production, this would come from an ML model (content_flags.quality_score).
     * For now: heuristic based on content length and media presence.
     */
    private qualityScore(post: RankablePost): number {
        let score = 0.5; // baseline

        // Longer content tends to be higher quality
        const contentLength = (post.content || "").length;
        if (contentLength > 100) score += 0.15;
        if (contentLength > 300) score += 0.1;

        // Posts with media tend to get more engagement
        if (post.mediaUrls && post.mediaUrls.length > 0) score += 0.15;

        // Posts with tags are more discoverable / well-categorized
        if (post.tags && post.tags.length > 0) score += 0.1;

        return Math.min(score, 1.0);
    }

    /**
     * Helper: get post age in hours.
     */
    private getAgeInHours(post: RankablePost): number {
        const publishDate = post.publishedAt || post.createdAt;
        const now = Date.now();
        return (now - new Date(publishDate).getTime()) / (1000 * 60 * 60);
    }

    /**
     * Update ranking weights (for A/B testing).
     */
    setWeights(weights: Partial<RankingWeights>): void {
        this.weights = { ...this.weights, ...weights };
    }
}
