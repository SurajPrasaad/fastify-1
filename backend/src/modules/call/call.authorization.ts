/**
 * Call Authorization — Per-call security checks
 * Parallel block check, privacy check, follow status, spam detection
 */

import { db } from '../../config/drizzle.js';
import { redis } from '../../config/redis.js';
import { blocks, follows, userPrivacy } from '../../db/schema.js';
import { eq, and, or } from 'drizzle-orm';
import type { AuthResult } from './call.types.js';

export class CallAuthorization {

    /**
     * Full authorization check for a call initiation
     * Runs all checks in parallel for speed
     */
    async authorizeCall(callerId: string, targetId: string): Promise<AuthResult> {
        const [blockStatus, privacySettings, followStatus, spamScore] = await Promise.all([
            this.checkBidirectionalBlock(callerId, targetId),
            this.getUserCallPrivacy(targetId),
            this.getFollowStatus(callerId, targetId),
            this.getCallSpamScore(callerId),
        ]);

        // Block check
        if (blockStatus) {
            return { allowed: false, reason: 'BLOCKED' };
        }

        // Spam detection
        if (spamScore > 50) {
            return { allowed: false, reason: 'SPAM_DETECTED' };
        }

        // Privacy-based call permissions
        const callPermission = privacySettings || 'EVERYONE';
        switch (callPermission) {
            case 'EVERYONE':
                return { allowed: true };
            case 'FOLLOWERS':
                return {
                    allowed: followStatus.isFollowing,
                    reason: followStatus.isFollowing ? undefined : 'NOT_FOLLOWING',
                };
            case 'MUTUAL':
                return {
                    allowed: followStatus.isMutual,
                    reason: followStatus.isMutual ? undefined : 'NOT_MUTUAL',
                };
            case 'NOBODY':
                return { allowed: false, reason: 'CALLS_DISABLED' };
            default:
                return { allowed: true };
        }
    }

    /**
     * Check if either user has blocked the other
     */
    private async checkBidirectionalBlock(
        userA: string,
        userB: string,
    ): Promise<boolean> {
        const result = await db
            .select()
            .from(blocks)
            .where(
                or(
                    and(eq(blocks.blockerId, userA), eq(blocks.blockedId, userB)),
                    and(eq(blocks.blockerId, userB), eq(blocks.blockedId, userA)),
                ),
            )
            .limit(1);

        return result.length > 0;
    }

    /**
     * Get user's call privacy setting
     * Returns: 'EVERYONE' | 'FOLLOWERS' | 'MUTUAL' | 'NOBODY'
     */
    private async getUserCallPrivacy(userId: string): Promise<string> {
        // First check Redis cache
        const cached = await redis.get(`privacy:call:${userId}`);
        if (cached) return cached;

        // Fallback to DB
        const privacy = await db
            .select()
            .from(userPrivacy)
            .where(eq(userPrivacy.userId, userId))
            .limit(1);

        // Use profile visibility as proxy; default to EVERYONE
        const permission = privacy[0]?.profileVisibility === 'PRIVATE'
            ? 'FOLLOWERS'
            : 'EVERYONE';

        // Cache for 5 minutes
        await redis.set(`privacy:call:${userId}`, permission, 'EX', 300);

        return permission;
    }

    /**
     * Get follow status between two users
     */
    private async getFollowStatus(
        callerId: string,
        targetId: string,
    ): Promise<{ isFollowing: boolean; isMutual: boolean }> {
        const followResults = await db
            .select()
            .from(follows)
            .where(
                or(
                    and(eq(follows.followerId, callerId), eq(follows.followingId, targetId)),
                    and(eq(follows.followerId, targetId), eq(follows.followingId, callerId)),
                ),
            );

        const callerFollowsTarget = followResults.some(
            (f) => f.followerId === callerId && f.followingId === targetId,
        );
        const targetFollowsCaller = followResults.some(
            (f) => f.followerId === targetId && f.followingId === callerId,
        );

        return {
            isFollowing: callerFollowsTarget,
            isMutual: callerFollowsTarget && targetFollowsCaller,
        };
    }

    /**
     * Get call spam score for a user (based on recent behavior)
     * Score > 50 = suspected spammer
     */
    private async getCallSpamScore(userId: string): Promise<number> {
        const key = `spam:call:${userId}`;
        const score = await redis.get(key);
        return Number(score || 0);
    }

    /**
     * Increment spam score for a user
     * Called on rejected/missed calls
     */
    async incrementSpamScore(userId: string, points: number): Promise<void> {
        const key = `spam:call:${userId}`;
        await redis.incrby(key, points);
        await redis.expire(key, 3600); // 1 hour window
    }
}

export const callAuthorization = new CallAuthorization();
