
import { ExploreRepository } from "./explore.repository.js";
import { RankingEngine, type ScoredPost } from "./ranking/ranking.engine.js";
import { CandidateGenerator } from "./candidates/candidate.generator.js";
import { DiversityEnforcer } from "./candidates/diversity.enforcer.js";
import { ContentFilter } from "./safety/content.filter.js";
import { INTERACTION_WEIGHTS } from "./ranking/ranking.weights.js";
import { redis } from "../../config/redis.js";
import type {
    ExplorePost,
    CandidatePool,
    ExploreCursor,
    CandidateSource,
} from "./explore.dto.js";

/**
 * Explore Service — Request Orchestrator
 *
 * This is the core orchestration layer for the Explore & Discovery Platform.
 * It coordinates: Candidate Generation → Ranking → Diversity → Safety → Hydration
 *
 * Pipeline:
 *   1. Generate candidates from multiple pools (trending, personalized, category, serendipity)
 *   2. Merge and deduplicate candidates across pools
 *   3. Hydrate post IDs into full post objects
 *   4. Pre-ranking safety filter (remove spam/unsafe)
 *   5. Rank using multi-factor scoring engine
 *   6. Apply diversity constraints (author/category caps)
 *   7. Post-ranking safety filter (final check)
 *   8. Track seen posts for deduplication
 *   9. Build response with cursor
 */
export class ExploreService {
    private repository: ExploreRepository;
    private rankingEngine: RankingEngine;
    private candidateGenerator: CandidateGenerator;
    private diversityEnforcer: DiversityEnforcer;
    private contentFilter: ContentFilter;

    constructor() {
        this.repository = new ExploreRepository();
        this.rankingEngine = new RankingEngine();
        this.candidateGenerator = new CandidateGenerator(this.repository);
        this.diversityEnforcer = new DiversityEnforcer();
        this.contentFilter = new ContentFilter();
    }

    // ─── PERSONALIZED "FOR YOU" FEED ────────────────────────────────────────

    /**
     * Get personalized explore feed (For You).
     * Uses the full pipeline: candidates → rank → diversity → safety.
     */
    async getExploreFeed(userId: string | undefined, limit: number, cursor?: string, region?: string) {
        const offset = cursor ? this.decodeCursorOffset(cursor) : 0;

        // 1. Generate candidates from multiple pools
        let pools: CandidatePool[];
        if (userId) {
            pools = await this.candidateGenerator.generateForYou(userId, limit, region);
        } else {
            // Unauthenticated: trending + serendipity only
            pools = await this.candidateGenerator.generateForYou("__anonymous__", limit, region);
        }

        // 2. Merge all candidates, deduplicate
        const allCandidates = this.mergePools(pools);

        // 3. Hydrate post IDs into full objects
        const candidateIds = allCandidates.map(c => c.postId);
        const hydratedPosts = await this.repository.hydratePostIds(candidateIds, userId);

        // 4. Pre-ranking safety filter
        const safePosts = this.contentFilter.preRankFilter(hydratedPosts);

        // 5. Build user profile for personalized ranking
        const userProfile = userId
            ? await this.buildUserProfile(userId)
            : undefined;

        // 6. Rank using multi-factor scoring
        const ranked = this.rankingEngine.rankPosts(safePosts as any, userProfile, "FOR_YOU");

        // 7. Apply diversity constraints
        const seenIds = userId ? await this.repository.getSeenPostIds(userId) : new Set<string>();
        const diversified = this.diversityEnforcer.enforce(ranked, seenIds);

        // 8. Post-ranking safety filter
        const finalPosts = this.contentFilter.postRankFilter(diversified);

        // 9. Paginate
        const paginated = finalPosts.slice(0, limit);

        // 10. Track seen posts for dedup
        if (userId && paginated.length > 0) {
            await this.repository.markAsSeen(userId, paginated.map(p => p.id));
        }

        // 11. Build response
        const nextCursor = paginated.length >= limit
            ? this.encodeCursorOffset(offset + limit)
            : null;

        return {
            posts: paginated.map(p => this.formatPost(p)),
            nextCursor,
            hasMore: !!nextCursor,
            meta: {
                count: paginated.length,
                provider: "EXPLORE_FOR_YOU_V1",
                pools: pools.map(p => p.source),
            },
        };
    }

    // ─── TRENDING FEED ──────────────────────────────────────────────────────

    /**
     * Get globally or regionally trending feed.
     */
    async getTrendingFeed(limit: number, cursor?: string, region?: string, timeWindow?: string) {
        const offset = cursor ? this.decodeCursorOffset(cursor) : 0;

        // Fetch trending post IDs from Redis (pre-scored)
        let postIds = await this.repository.getTrendingPostIds(limit * 2, offset, region);

        // Fallback to PostgreSQL if Redis is empty
        if (postIds.length === 0) {
            const fallback = await this.repository.getFallbackTrending(limit, cursor);
            postIds = fallback.map(p => p.id);
        }

        // Hydrate
        const posts = await this.repository.hydratePostIds(postIds.slice(0, limit));

        // Light safety filter (trending is already pre-scored)
        const safePosts = this.contentFilter.preRankFilter(posts);

        // Re-rank for freshness (trending sorted sets may be slightly stale)
        const ranked = this.rankingEngine.rankPosts(safePosts as any, undefined, "TRENDING");
        const paginated = ranked.slice(0, limit);

        const nextCursor = paginated.length >= limit
            ? this.encodeCursorOffset(offset + limit)
            : null;

        return {
            posts: paginated.map(p => this.formatPost(p)),
            nextCursor,
            hasMore: !!nextCursor,
            meta: {
                count: paginated.length,
                provider: "EXPLORE_TRENDING_V1",
                region: region || "global",
            },
        };
    }

    // ─── CATEGORY DISCOVERY ─────────────────────────────────────────────────

    /**
     * Get posts for a specific category/tag.
     */
    async getCategoryFeed(slug: string, limit: number, cursor?: string, userId?: string) {
        // Try Redis category sorted set first
        const offset = cursor ? this.decodeCursorOffset(cursor) : 0;
        const pools = await this.candidateGenerator.generateForCategory(slug, limit * 2);

        const candidateIds = pools.flatMap(p => p.candidates.map(c => c.postId));
        let posts: any[];

        if (candidateIds.length > 0) {
            posts = await this.repository.hydratePostIds(candidateIds, userId);
        } else {
            // Full PostgreSQL fallback
            posts = await this.repository.getCategoryPosts(slug, limit, cursor) as any[];
        }

        const safePosts = this.contentFilter.preRankFilter(posts);
        const ranked = this.rankingEngine.rankPosts(safePosts as any, undefined, "CATEGORY");
        const paginated = ranked.slice(0, limit);

        const nextCursor = paginated.length >= limit
            ? this.encodeCursorOffset(offset + limit)
            : null;

        return {
            posts: paginated.map(p => this.formatPost(p)),
            nextCursor,
            hasMore: !!nextCursor,
            meta: {
                count: paginated.length,
                provider: "EXPLORE_CATEGORY_V1",
                category: slug,
            },
        };
    }

    // ─── SEARCH ─────────────────────────────────────────────────────────────

    /**
     * Search-integrated discovery.
     * Searches posts, users, or hashtags based on type parameter.
     */
    async search(query: string, limit: number, cursor?: string, type: string = "posts") {
        switch (type) {
            case "users": {
                const users = await this.repository.searchUsers(query, limit);
                return {
                    data: users,
                    nextCursor: null,
                    hasMore: false,
                    meta: { count: users.length, provider: "EXPLORE_SEARCH_USERS_V1", type },
                };
            }
            case "hashtags": {
                const hashtags = await this.repository.searchHashtags(query, limit);
                return {
                    data: hashtags,
                    nextCursor: null,
                    hasMore: false,
                    meta: { count: hashtags.length, provider: "EXPLORE_SEARCH_HASHTAGS_V1", type },
                };
            }
            case "posts":
            default: {
                const posts = await this.repository.searchPosts(query, limit, cursor);

                // Rank search results with engagement + relevance
                const ranked = this.rankingEngine.rankPosts(posts as any, undefined, "SEARCH");
                const paginated = ranked.slice(0, limit);

                const lastPost = paginated[paginated.length - 1];
                const nextCursor = paginated.length >= limit && lastPost
                    ? (lastPost as any).createdAt?.toISOString() || null
                    : null;

                return {
                    data: paginated.map(p => this.formatPost(p)),
                    nextCursor,
                    hasMore: !!nextCursor,
                    meta: { count: paginated.length, provider: "EXPLORE_SEARCH_POSTS_V1", type },
                };
            }
        }
    }

    // ─── CREATOR RECOMMENDATIONS ────────────────────────────────────────────

    /**
     * Get recommended creators to follow.
     */
    async getRecommendedCreators(limit: number, userId?: string, category?: string) {
        let interestTags: string[] | undefined;

        if (userId) {
            interestTags = await this.repository.getUserTopInterests(userId, 5);
        }

        const creators = await this.repository.getRecommendedCreators(limit, userId, interestTags);

        return {
            data: creators,
            meta: {
                count: creators.length,
                provider: "EXPLORE_CREATORS_V1",
            },
        };
    }

    // ─── TRENDING HASHTAGS ──────────────────────────────────────────────────

    /**
     * Get trending hashtags.
     */
    async getTrendingHashtags(limit: number) {
        const hashtags = await this.repository.getTrendingHashtags(limit);

        return {
            data: hashtags,
            meta: {
                count: hashtags.length,
                provider: "EXPLORE_TRENDING_HASHTAGS_V1",
            },
        };
    }

    // ─── INTERACTION TRACKING ───────────────────────────────────────────────

    /**
     * Track user interaction for personalization.
     * Updates user interest affinity in Redis.
     */
    async trackInteraction(
        userId: string,
        postId: string,
        action: string,
        duration: number = 0
    ): Promise<void> {
        // Calculate score delta based on action type
        let scoreDelta = INTERACTION_WEIGHTS[action] || 0;

        // View scoring: only count meaningful views (>5s dwell time)
        if (action === "VIEW" && duration <= 5) {
            scoreDelta = 0;
        }

        if (scoreDelta === 0) return;

        // Fetch post metadata for affinity update
        const [tags, authorId] = await Promise.all([
            this.repository.getPostTags(postId),
            this.repository.getPostAuthorId(postId),
        ]);

        if (tags.length === 0 && !authorId) return;

        // Update user affinities in Redis
        await this.repository.updateUserAffinity(userId, tags, authorId || "", scoreDelta);

        // Also mark as seen
        await this.repository.markAsSeen(userId, [postId]);
    }

    // ─── SCORE WORKER (called by Kafka consumer) ───────────────────────────

    /**
     * Recompute and update the trending score for a post.
     * Called by the score worker when engagement events arrive via Kafka.
     */
    async updatePostScore(postId: string): Promise<void> {
        const post = await this.repository.getPostEngagement(postId);
        if (!post) return;

        const ageHours = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);

        // Trending score: engagement velocity with time decay
        const engagementRaw = post.likesCount + post.commentsCount * 2 + post.repostsCount * 3;
        const velocity = engagementRaw / (ageHours + 2);
        const freshness = Math.exp(-ageHours / 48); // 48h half-life
        const trendingScore = (velocity * 0.6) + (freshness * 100 * 0.4);

        await this.repository.updateTrendingScore(
            postId,
            trendingScore,
            post.tags || []
        );
    }

    /**
     * Ingest a new post into the explore system.
     * Called when a post.created event arrives via Kafka.
     */
    async ingestPost(postId: string): Promise<void> {
        // Compute initial score and add to trending sets
        await this.updatePostScore(postId);
    }

    /**
     * Remove a post from explore (on deletion or moderation reject).
     */
    async removePost(postId: string): Promise<void> {
        await this.repository.removeTrendingPost(postId);
    }

    // ─── PRIVATE HELPERS ────────────────────────────────────────────────────

    /**
     * Build a user profile for personalized ranking.
     */
    private async buildUserProfile(userId: string) {
        const [topInterests, topAuthors] = await Promise.all([
            this.repository.getUserTopInterests(userId, 20),
            this.repository.getUserTopAuthors(userId, 10),
        ]);

        // Convert to weighted maps
        const topicWeights: Record<string, number> = {};
        topInterests.forEach((tag, i) => {
            topicWeights[tag] = topInterests.length - i; // Higher rank = higher weight
        });

        const authorAffinities: Record<string, number> = {};
        topAuthors.forEach((authorId, i) => {
            authorAffinities[authorId] = topAuthors.length - i;
        });

        return { topicWeights, authorAffinities };
    }

    /**
     * Merge candidate pools and deduplicate.
     */
    private mergePools(pools: CandidatePool[]) {
        const seen = new Set<string>();
        const merged: Array<{ postId: string; score: number; source: CandidateSource }> = [];

        for (const pool of pools) {
            for (const candidate of pool.candidates) {
                if (!seen.has(candidate.postId)) {
                    seen.add(candidate.postId);
                    merged.push(candidate);
                }
            }
        }

        return merged;
    }

    /**
     * Format a scored post for API response.
     */
    private formatPost(post: ScoredPost): any {
        return {
            id: post.id,
            userId: post.userId,
            content: post.content,
            mediaUrls: post.mediaUrls,
            tags: post.tags,
            originalPostId: post.originalPostId,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            publishedAt: post.publishedAt,
            likesCount: post.likesCount,
            commentsCount: post.commentsCount,
            repostsCount: post.repostsCount,
            author: (post as any).author,
            isLiked: (post as any).isLiked || false,
            isBookmarked: (post as any).isBookmarked || false,
            rankScore: post.rankScore,
            source: post.source,
        };
    }

    /**
     * Encode a simple offset-based cursor.
     */
    private encodeCursorOffset(offset: number): string {
        return Buffer.from(JSON.stringify({ o: offset, t: Date.now() })).toString("base64url");
    }

    /**
     * Decode an offset-based cursor.
     */
    private decodeCursorOffset(cursor: string): number {
        try {
            const decoded = JSON.parse(Buffer.from(cursor, "base64url").toString());
            return decoded.o || 0;
        } catch {
            return 0;
        }
    }
}
