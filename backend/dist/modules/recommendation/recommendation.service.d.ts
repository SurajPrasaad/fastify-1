import { RecommendationRepository } from "./recommendation.repository.js";
import type { TrackEventInput } from "./recommendation.schema.js";
export declare class RecommendationService {
    private recommendationRepository;
    constructor(recommendationRepository?: RecommendationRepository);
    /**
     * Updates User Affinity Score based on interaction.
     * Logic:
     * 1. Get tags from Post.
     * 2. Calculate score delta based on action.
     * 3. Update Redis Sorted Set for user interests.
     * 4. Mark post as 'seen'.
     */
    trackInteraction(userId: string, input: TrackEventInput): Promise<void>;
    /**
     * Generates the "For You" feed.
     * Logic:
     * 1. Get Top 5 Tags from Redis (ZREVRANGE).
     * 2. Get Seen Posts from Redis (SMEMBERS).
     * 3. Query DB for posts matching tags, excluding seen.
     * 4. Fallback to Global Trending if no tags or not enough content.
     */
    getForYouFeed(userId: string, limit?: number): Promise<any[]>;
}
//# sourceMappingURL=recommendation.service.d.ts.map