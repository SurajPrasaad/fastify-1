/**
 * IP Reputation Engine — Scoring system for DDoS/abuse protection
 * Uses Redis sorted set with exponential decay scoring.
 */

import { redis } from '../../config/redis.js';

type ReputationEvent = 'CONNECT' | 'AUTH_FAIL' | 'RATE_LIMIT' | 'ABUSE' | 'CALL_SPAM';

const PENALTIES: Record<ReputationEvent, number> = {
    CONNECT: 0,
    AUTH_FAIL: 10,
    RATE_LIMIT: 25,
    ABUSE: 100,
    CALL_SPAM: 50,
};

const BLOCK_THRESHOLD = 500;
const BLOCK_DURATION = 3600; // 1 hour
const REPUTATION_WINDOW = 86400; // 24 hours

export class IpReputationEngine {

    /**
     * Update IP reputation score
     */
    async recordEvent(ip: string, event: ReputationEvent): Promise<number> {
        const penalty = PENALTIES[event];
        if (!penalty) return 0;

        const score = await redis.zincrby('ip:reputation', penalty, ip);
        await redis.expire('ip:reputation', REPUTATION_WINDOW);

        const numericScore = Number(score);

        if (numericScore > BLOCK_THRESHOLD) {
            await this.blockIp(ip);
            console.warn(`[IPReputation] IP ${ip} blocked (score: ${numericScore})`);
        }

        return numericScore;
    }

    /**
     * Check if an IP is blocked
     */
    async isBlocked(ip: string): Promise<boolean> {
        const blocked = await redis.get(`ip:blocked:${ip}`);
        return blocked === '1';
    }

    /**
     * Block an IP for a duration
     */
    async blockIp(ip: string, durationSeconds: number = BLOCK_DURATION): Promise<void> {
        await redis.set(`ip:blocked:${ip}`, '1', 'EX', durationSeconds);
    }

    /**
     * Unblock an IP manually
     */
    async unblockIp(ip: string): Promise<void> {
        await redis.del(`ip:blocked:${ip}`);
        await redis.zrem('ip:reputation', ip);
    }

    /**
     * Get current reputation score for an IP
     */
    async getScore(ip: string): Promise<number> {
        const score = await redis.zscore('ip:reputation', ip);
        return Number(score || 0);
    }

    /**
     * Get top offending IPs
     */
    async getTopOffenders(count: number = 20): Promise<Array<{ ip: string; score: number }>> {
        const results = await redis.zrevrange('ip:reputation', 0, count - 1, 'WITHSCORES');
        const offenders: Array<{ ip: string; score: number }> = [];

        for (let i = 0; i < results.length; i += 2) {
            offenders.push({
                ip: results[i]!,
                score: Number(results[i + 1] || 0),
            });
        }

        return offenders;
    }
}

export const ipReputation = new IpReputationEngine();
