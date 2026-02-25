
import type { ScoredPost } from "../ranking/ranking.engine.js";

/**
 * Content Filter
 * 
 * Pre-ranking and post-ranking safety filter for explore content.
 * 
 * Pre-ranking: Removes clearly unsafe content before ranking to save computation.
 * Post-ranking: Final safety check on the ranked output before serving to users.
 *
 * In production, this would integrate with ML-based classifiers for:
 * - Spam detection (logistic regression)
 * - NSFW detection (CNN-based image classification)
 * - Toxicity detection (BERT-based NLP)
 * - Bot detection (behavioral analysis)
 *
 * For now: heuristic-based filtering using content signals.
 */
export class ContentFilter {
    // Keywords that indicate potentially harmful content
    private static SPAM_PATTERNS = [
        /\b(buy now|click here|free money|act now|limited time|subscribe now)\b/gi,
        // Excessive caps and punctuation
        /[A-Z]{10,}/g,
        /[!?]{5,}/g,
    ];

    private static BLOCKED_PATTERNS: RegExp[] = [
        // Add blocked patterns as needed (configured per deployment)
    ];

    /**
     * Pre-ranking filter: remove obviously unsafe content.
     * Called BEFORE ranking to exclude candidates early.
     */
    preRankFilter(posts: any[]): any[] {
        return posts.filter(post => {
            // Skip empty content
            if (!post.content || post.content.trim().length === 0) return false;

            // Skip verified spam patterns
            const spamScore = this.computeSpamScore(post.content);
            if (spamScore > 0.8) return false;

            return true;
        });
    }

    /**
     * Post-ranking filter: final safety check on ranked results.
     * Called AFTER ranking but before serving to users.
     */
    postRankFilter(posts: ScoredPost[]): ScoredPost[] {
        return posts.filter(post => {
            // Check for blocked patterns
            for (const pattern of ContentFilter.BLOCKED_PATTERNS) {
                if (pattern.test(post.content || "")) return false;
            }

            return true;
        });
    }

    /**
     * Compute a basic spam score for content.
     * 0 = not spam, 1 = definitely spam.
     * 
     * In production: replaced by ML model inference.
     */
    private computeSpamScore(content: string): number {
        let score = 0;
        let matchCount = 0;

        for (const pattern of ContentFilter.SPAM_PATTERNS) {
            // Reset lastIndex for global regex
            pattern.lastIndex = 0;
            const matches = content.match(pattern);
            if (matches) matchCount += matches.length;
        }

        // Ratio of spam signals to content length
        score += Math.min(matchCount / 3, 0.5);

        // Excessive link count
        const linkCount = (content.match(/https?:\/\//g) || []).length;
        if (linkCount > 3) score += 0.3;

        // Very short content with links (likely spam)
        if (content.length < 50 && linkCount > 0) score += 0.3;

        return Math.min(score, 1.0);
    }
}
