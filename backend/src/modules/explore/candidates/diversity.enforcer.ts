
import type { DiversityConfig } from "../explore.dto.js";
import { DIVERSITY_DEFAULTS } from "../ranking/ranking.weights.js";
import type { ScoredPost } from "../ranking/ranking.engine.js";

/**
 * Diversity Enforcer
 * 
 * Applies post-ranking diversity constraints to ensure the final feed is
 * varied and doesn't over-represent any single author or category.
 *
 * Constraints:
 * 1. Author cap: max N posts per author per page
 * 2. Category cap: max X% from any single category
 * 3. Deduplication: skip already-seen posts
 */
export class DiversityEnforcer {
    private config: DiversityConfig;

    constructor(config?: Partial<DiversityConfig>) {
        this.config = { ...DIVERSITY_DEFAULTS, ...config };
    }

    /**
     * Apply diversity constraints to a ranked list of posts.
     * Posts are already sorted by score descending.
     * Returns the filtered list maintaining score order.
     */
    enforce(candidates: ScoredPost[], seenIds: Set<string> = new Set()): ScoredPost[] {
        const result: ScoredPost[] = [];
        const authorCounts = new Map<string, number>();
        const categoryCounts = new Map<string, number>();

        for (const post of candidates) {
            // Skip duplicates (already seen by user)
            if (seenIds.has(post.id)) continue;

            // Skip duplicates within this page
            if (result.some(r => r.id === post.id)) continue;

            // Author diversity: enforce max posts per author
            const authorCount = authorCounts.get(post.userId) || 0;
            if (authorCount >= this.config.maxPerAuthor) continue;

            // Category diversity: enforce max ratio per category
            // Use first tag as primary category
            const primaryCategory = post.tags?.[0] || "__uncategorized__";
            const catCount = categoryCounts.get(primaryCategory) || 0;
            if (result.length > 0) {
                const catRatio = catCount / result.length;
                if (catRatio > this.config.maxCategoryRatio && result.length > 3) {
                    continue;
                }
            }

            // Passed all filters
            result.push(post);
            authorCounts.set(post.userId, authorCount + 1);
            categoryCounts.set(primaryCategory, catCount + 1);

            if (result.length >= this.config.pageSize) break;
        }

        return result;
    }

    /**
     * Update diversity config (for A/B testing).
     */
    setConfig(config: Partial<DiversityConfig>): void {
        this.config = { ...this.config, ...config };
    }
}
