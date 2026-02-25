
import { ExploreRepository } from "../explore.repository.js";
import type { CandidatePool, CandidateSource, ExploreCandidate } from "../explore.dto.js";
import { POOL_SIZES } from "../ranking/ranking.weights.js";

/**
 * Candidate Generator
 * 
 * Uses a fan-in architecture to fetch candidates from multiple sources in parallel,
 * then merges and deduplicates them before passing to the Ranking Engine.
 *
 * Sources:
 * 1. Trending (global/regional) — Redis sorted sets
 * 2. Personalized — tag-based + author-affinity-based
 * 3. Category — tag-specific trending
 * 4. Serendipity — random injection for diversity
 * 5. Cold Start — fallback for new users with no interaction history
 */
export class CandidateGenerator {
    constructor(private repository: ExploreRepository) { }

    /**
     * Generate candidates from all pools in parallel.
     * This is the main entry point called by ExploreService.
     */
    async generateForYou(
        userId: string,
        limit: number,
        region?: string
    ): Promise<CandidatePool[]> {
        const seenIds = await this.repository.getSeenPostIds(userId);
        const topInterests = await this.repository.getUserTopInterests(userId);

        const hasInterests = topInterests.length > 0;

        // Parallel fan-in from all sources
        const pools = await Promise.all([
            this.getTrendingPool(limit * POOL_SIZES.trending, region, seenIds),
            hasInterests
                ? this.getPersonalizedPool(userId, limit * POOL_SIZES.personalized, topInterests, seenIds)
                : this.getColdStartPool(limit * POOL_SIZES.coldStart, seenIds),
            this.getSerendipityPool(limit * POOL_SIZES.serendipity, seenIds),
        ]);

        return pools;
    }

    /**
     * Generate candidates for a specific category/tag.
     */
    async generateForCategory(
        slug: string,
        limit: number,
        seenIds: Set<string> = new Set()
    ): Promise<CandidatePool[]> {
        // Try Redis first, fall back to PostgreSQL
        const redisIds = await this.repository.getCategoryTrendingIds(slug, limit * 2);
        const filteredIds = redisIds.filter(id => !seenIds.has(id));

        if (filteredIds.length >= limit) {
            return [{
                source: "CATEGORY" as CandidateSource,
                candidates: filteredIds.slice(0, limit).map((postId, i) => ({
                    postId,
                    score: limit - i, // Preserve ordering
                    source: "CATEGORY" as CandidateSource,
                })),
            }];
        }

        // Fallback: PostgreSQL query
        const pgPosts = await this.repository.getCategoryPosts(slug, limit);
        return [{
            source: "CATEGORY" as CandidateSource,
            candidates: pgPosts.map((p, i) => ({
                postId: p.id,
                score: limit - i,
                source: "CATEGORY" as CandidateSource,
            })),
        }];
    }

    // ─── Private Pool Generators ────────────────────────────────────────────

    private async getTrendingPool(
        limit: number,
        region: string | undefined,
        seenIds: Set<string>
    ): Promise<CandidatePool> {
        let postIds = await this.repository.getTrendingPostIds(limit, 0, region);
        postIds = postIds.filter(id => !seenIds.has(id));

        // If Redis returns too few, supplement with PostgreSQL fallback
        if (postIds.length < limit / 2) {
            const fallbackPosts = await this.repository.getFallbackTrending(
                limit,
                undefined,
                [...seenIds]
            );
            const fallbackIds = fallbackPosts.map(p => p.id);
            postIds = [...new Set([...postIds, ...fallbackIds])];
        }

        return {
            source: "TRENDING",
            candidates: postIds.map((postId, i) => ({
                postId,
                score: limit - i, // Preserve sorted-set ordering as initial score
                source: "TRENDING" as CandidateSource,
            })),
        };
    }

    private async getPersonalizedPool(
        userId: string,
        limit: number,
        topInterests: string[],
        seenIds: Set<string>
    ): Promise<CandidatePool> {
        const topAuthors = await this.repository.getUserTopAuthors(userId);
        const excludeIds = [...seenIds];

        // Parallel: tag-based + author-based candidates
        const [tagPosts, authorPosts] = await Promise.all([
            this.repository.getPostsByTags(topInterests, Math.ceil(limit * 0.7), excludeIds),
            this.repository.getPostsByAuthors(topAuthors, Math.ceil(limit * 0.3), excludeIds),
        ]);

        // Merge and deduplicate
        const allPosts = [...tagPosts, ...authorPosts];
        const unique = new Map(allPosts.map(p => [p.id, p]));

        return {
            source: "PERSONALIZED",
            candidates: Array.from(unique.values()).map((p, i) => ({
                postId: p.id,
                score: unique.size - i,
                source: "PERSONALIZED" as CandidateSource,
            })),
        };
    }

    private async getColdStartPool(
        limit: number,
        seenIds: Set<string>
    ): Promise<CandidatePool> {
        // For new users: mix of trending + random discovery
        const excludeIds = [...seenIds];

        const [trendingPosts, randomPosts] = await Promise.all([
            this.repository.getFallbackTrending(Math.ceil(limit * 0.7), undefined, excludeIds),
            this.repository.getRandomRecentPosts(Math.ceil(limit * 0.3), excludeIds),
        ]);

        const allPosts = [...trendingPosts, ...randomPosts];
        const unique = new Map(allPosts.map(p => [p.id, p]));

        return {
            source: "COLD_START",
            candidates: Array.from(unique.values()).map((p, i) => ({
                postId: p.id,
                score: unique.size - i,
                source: "COLD_START" as CandidateSource,
            })),
        };
    }

    private async getSerendipityPool(
        limit: number,
        seenIds: Set<string>
    ): Promise<CandidatePool> {
        const randomPosts = await this.repository.getRandomRecentPosts(limit, [...seenIds]);

        return {
            source: "SERENDIPITY",
            candidates: randomPosts.map((p, i) => ({
                postId: p.id,
                score: limit - i,
                source: "SERENDIPITY" as CandidateSource,
            })),
        };
    }
}
