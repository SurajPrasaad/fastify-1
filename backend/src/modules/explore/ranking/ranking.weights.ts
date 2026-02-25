
import type { RankingWeights } from "../explore.dto.js";

/**
 * Default ranking weights for explore feed.
 * These are the baseline weights used when no A/B test variant is active.
 */
export const DEFAULT_WEIGHTS: RankingWeights = {
    engagement: 0.30,
    freshness: 0.25,
    personalization: 0.25,
    quality: 0.10,
    diversity: 0.10,
};

/**
 * Time decay half-lives in hours for different contexts.
 */
export const DECAY_CONFIG = {
    explore: 48,    // Explore feed: 48-hour half-life (slower decay, discovery-oriented)
    trending: 12,   // Trending: 12-hour half-life (faster cycle)
    home: 24,       // Home feed: 24-hour half-life
};

/**
 * Diversity constraints for explore feed.
 */
export const DIVERSITY_DEFAULTS = {
    maxPerAuthor: 2,       // Max posts from same author per page
    maxCategoryRatio: 0.4, // Max 40% from any single category
    pageSize: 20,
};

/**
 * Interaction signal weights for affinity computation.
 */
export const INTERACTION_WEIGHTS: Record<string, number> = {
    VIEW: 1,
    LIKE: 5,
    COMMENT: 8,
    SHARE: 10,
    SAVE: 8,
    REPOST: 10,
    NOT_INTERESTED: -10,
    FOLLOW_AUTHOR: 15,
};

/**
 * Candidate pool sizes (fetch more candidates than needed for ranking quality).
 */
export const POOL_SIZES = {
    trending: 3,       // multiplier × requested limit
    personalized: 3,
    category: 2,
    serendipity: 1,
    coldStart: 3,
};
