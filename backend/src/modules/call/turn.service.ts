/**
 * TURN Credential Service — Ephemeral TURN credential issuance
 * Implements HMAC-SHA1 credentials compatible with coturn's use-auth-secret mode.
 * Includes geo-based TURN selection with caller/callee awareness,
 * load-balanced routing, and per-user allocation tracking.
 */

import crypto from 'crypto';
import { redis } from '../../config/redis.js';
import {
    TURN_SECRET,
    TURN_CREDENTIAL_TTL,
    REGION_TURN_MAP,
    LOCAL_REGION,
} from '../../config/region.js';
import type { TurnCredentials } from './call.types.js';

const MAX_CONCURRENT_ALLOCATIONS = 2; // per user
const OVERLOAD_THRESHOLD = 90;         // percent
const SPILLOVER_THRESHOLD = 80;        // percent — both regions high

export class TurnService {

    /**
     * Issue ephemeral TURN credentials for a user
     * Credentials are HMAC-SHA1 signed, compatible with coturn's use-auth-secret
     */
    async issue(userId: string, targetRegion?: string): Promise<TurnCredentials> {
        const region = targetRegion || LOCAL_REGION;

        // Check per-user allocation limit
        const currentAllocations = await redis.get(`turn:alloc:${userId}`);
        if (Number(currentAllocations || 0) >= MAX_CONCURRENT_ALLOCATIONS) {
            throw new Error('TURN_ALLOCATION_LIMIT: Maximum concurrent TURN allocations exceeded');
        }

        // Track allocation
        await redis.incr(`turn:alloc:${userId}`);
        await redis.expire(`turn:alloc:${userId}`, 300); // 5 min TTL

        const turnDomain = await this.selectTurnServer(region);
        return this.generateCredentials(userId, turnDomain);
    }

    /**
     * Issue TURN credentials for a cross-region call
     * Selects optimal TURN server based on both caller and callee regions
     */
    async issueForCall(
        userId: string,
        callerRegion: string,
        calleeRegion: string,
    ): Promise<TurnCredentials> {
        // Check per-user allocation limit
        const currentAllocations = await redis.get(`turn:alloc:${userId}`);
        if (Number(currentAllocations || 0) >= MAX_CONCURRENT_ALLOCATIONS) {
            throw new Error('TURN_ALLOCATION_LIMIT: Maximum concurrent TURN allocations exceeded');
        }

        // Track allocation
        await redis.incr(`turn:alloc:${userId}`);
        await redis.expire(`turn:alloc:${userId}`, 300);

        const turnDomain = await this.selectTurnForCall(callerRegion, calleeRegion);
        return this.generateCredentials(userId, turnDomain);
    }

    /**
     * Generate HMAC-SHA1 credentials compatible with coturn
     */
    private generateCredentials(userId: string, turnDomain: string): TurnCredentials {
        const timestamp = Math.floor(Date.now() / 1000) + TURN_CREDENTIAL_TTL;
        const username = `${timestamp}:${userId}`;
        const credential = crypto
            .createHmac('sha1', TURN_SECRET)
            .update(username)
            .digest('base64');

        return {
            urls: [
                `stun:${turnDomain}:3478`,
                `turn:${turnDomain}:3478?transport=udp`,     // UDP first (lowest latency)
                `turn:${turnDomain}:3478?transport=tcp`,     // TCP fallback
                `turns:${turnDomain}:5349?transport=tcp`,    // TLS last resort (firewalled networks)
            ],
            username,
            credential,
            ttl: TURN_CREDENTIAL_TTL,
        };
    }

    /**
     * Geo-based TURN server selection with load awareness
     */
    private async selectTurnServer(preferredRegion: string): Promise<string> {
        const domain = REGION_TURN_MAP[preferredRegion];
        if (!domain) {
            return REGION_TURN_MAP[LOCAL_REGION] || 'turn.platform.com';
        }

        // Check load for health-based routing
        const load = await redis.get(`turn:load:${preferredRegion}`);
        if (Number(load || 0) > OVERLOAD_THRESHOLD) {
            // Region overloaded — find least loaded
            return this.selectLeastLoaded();
        }

        return domain;
    }

    /**
     * Select optimal TURN for a call between two regions
     * Handles same-region, cross-region, and both-overloaded scenarios
     */
    private async selectTurnForCall(callerRegion: string, calleeRegion: string): Promise<string> {
        // Same region — always use local TURN
        if (callerRegion === calleeRegion) {
            return this.selectTurnServer(callerRegion);
        }

        // Cross-region — compare loads
        const [callerLoad, calleeLoad] = await Promise.all([
            redis.get(`turn:load:${callerRegion}`),
            redis.get(`turn:load:${calleeRegion}`),
        ]);

        const callerLoadNum = Number(callerLoad || 0);
        const calleeLoadNum = Number(calleeLoad || 0);

        // Both regions overloaded — find a neutral region
        if (callerLoadNum > SPILLOVER_THRESHOLD && calleeLoadNum > SPILLOVER_THRESHOLD) {
            console.warn(`[TURN] Both regions overloaded (${callerRegion}: ${callerLoadNum}%, ${calleeRegion}: ${calleeLoadNum}%). Spilling to neutral.`);
            return this.selectLeastLoaded();
        }

        // Use the less loaded region
        if (callerLoadNum <= calleeLoadNum) {
            return REGION_TURN_MAP[callerRegion] || 'turn.platform.com';
        }
        return REGION_TURN_MAP[calleeRegion] || 'turn.platform.com';
    }

    /**
     * Select the least loaded TURN region (circuit breaker)
     */
    private async selectLeastLoaded(): Promise<string> {
        const loads: Array<{ region: string; load: number }> = [];

        for (const [region, _domain] of Object.entries(REGION_TURN_MAP)) {
            const load = Number(await redis.get(`turn:load:${region}`) || 0);
            loads.push({ region, load });
        }

        loads.sort((a, b) => a.load - b.load);
        const leastLoaded = loads[0];
        return REGION_TURN_MAP[leastLoaded?.region || LOCAL_REGION] || 'turn.platform.com';
    }

    /**
     * Release a TURN allocation for a user
     */
    async releaseAllocation(userId: string): Promise<void> {
        const current = await redis.get(`turn:alloc:${userId}`);
        if (Number(current || 0) > 0) {
            await redis.decr(`turn:alloc:${userId}`);
        }
    }

    /**
     * Report TURN load for this region (called by coturn health monitor)
     */
    async reportLoad(region: string, loadPercent: number): Promise<void> {
        await redis.set(`turn:load:${region}`, loadPercent.toString(), 'EX', 30);
    }

    /**
     * Get current TURN load across all regions
     */
    async getGlobalLoadReport(): Promise<Record<string, number>> {
        const report: Record<string, number> = {};
        for (const region of Object.keys(REGION_TURN_MAP)) {
            const load = await redis.get(`turn:load:${region}`);
            report[region] = Number(load || 0);
        }
        return report;
    }
}

export const turnService = new TurnService();
