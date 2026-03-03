/**
 * Distributed Presence Service
 * Handles online/offline tracking, heartbeat refresh, multi-device presence,
 * and cross-region presence federation via Kafka.
 */

import { redis } from '../../config/redis.js';
import { LOCAL_REGION, POD_ID } from '../../config/region.js';
import type { UserLocation, PresenceData } from '../call/call.types.js';

const PRESENCE_TTL = 120;      // seconds — expires if 2 heartbeats missed
const HEARTBEAT_INTERVAL = 30; // seconds
const SOCKET_MAP_TTL = 86400;  // 24h

export class PresenceService {

    /**
     * Register a user's presence when they connect via WebSocket
     */
    async registerPresence(
        userId: string,
        socketId: string,
        deviceType: string = 'web',
    ): Promise<void> {
        const now = Date.now().toString();

        // Store full presence hash
        await redis.hmset(`presence:${userId}`, {
            region: LOCAL_REGION,
            podId: POD_ID,
            socketId: socketId,
            connectedAt: now,
            deviceType: deviceType,
            lastHeartbeat: now,
        });
        await redis.expire(`presence:${userId}`, PRESENCE_TTL);

        // Store socket mapping (for fast user→socket lookup)
        await redis.hmset(`sock:${userId}`, {
            socketId: socketId,
            podId: POD_ID,
            region: LOCAL_REGION,
        });
        await redis.expire(`sock:${userId}`, SOCKET_MAP_TTL);

        // HyperLogLog for cardinality estimation
        await redis.pfadd(`region:users:${LOCAL_REGION}`, userId);

        console.log(`[Presence] ${userId} registered (${deviceType}) on pod ${POD_ID}`);
    }

    /**
     * Remove a user's presence on disconnect
     */
    async removePresence(userId: string): Promise<void> {
        await redis.del(`presence:${userId}`);
        await redis.del(`sock:${userId}`);
        console.log(`[Presence] ${userId} removed`);
    }

    /**
     * Refresh heartbeat — extends TTL
     */
    async heartbeat(userId: string): Promise<void> {
        const exists = await redis.exists(`presence:${userId}`);
        if (exists) {
            await redis.hset(`presence:${userId}`, 'lastHeartbeat', Date.now().toString());
            await redis.expire(`presence:${userId}`, PRESENCE_TTL);
        }
    }

    /**
     * Resolve user location — local first, then cross-region cache
     */
    async resolveUserLocation(targetUserId: string): Promise<UserLocation | null> {
        // Step 1: Check local presence (fast path, <2ms)
        const local = await redis.hgetall(`presence:${targetUserId}`);
        if (local && local['region'] === LOCAL_REGION && local['socketId']) {
            return {
                region: local['region'],
                socketId: local['socketId'],
                podId: local['podId'] || null,
            };
        }

        // Step 2: Check socket map (may have cross-region info)
        const sockMap = await redis.hgetall(`sock:${targetUserId}`);
        if (sockMap && sockMap['region']) {
            return {
                region: sockMap['region'],
                socketId: sockMap['socketId'] || null,
                podId: sockMap['podId'] || null,
            };
        }

        // Step 3: Check global presence cache (federated via Kafka)
        const globalPresence = await redis.hgetall(`gpresence:${targetUserId}`);
        if (globalPresence && globalPresence['region']) {
            return {
                region: globalPresence['region'],
                socketId: null,
                podId: null,
            };
        }

        // Step 4: User is offline
        return null;
    }

    /**
     * Check if user is online (quick boolean check)
     */
    async isOnline(userId: string): Promise<boolean> {
        const exists = await redis.exists(`presence:${userId}`);
        return exists === 1;
    }

    /**
     * Get estimated online user count for a region
     */
    async getRegionUserCount(region: string): Promise<number> {
        return redis.pfcount(`region:users:${region}`);
    }

    /**
     * Get full presence data for a user
     */
    async getPresence(userId: string): Promise<PresenceData | null> {
        const data = await redis.hgetall(`presence:${userId}`);
        if (!data || !data['region']) return null;
        return data as unknown as PresenceData;
    }

    /**
     * Bulk resolve presence for multiple users
     */
    async bulkResolve(userIds: string[]): Promise<Map<string, UserLocation>> {
        const results = new Map<string, UserLocation>();

        // Pipeline requests for efficiency
        const pipeline = redis.pipeline();
        for (const userId of userIds) {
            pipeline.hgetall(`presence:${userId}`);
        }
        const responses = await pipeline.exec();

        if (responses) {
            for (let i = 0; i < userIds.length; i++) {
                const [err, data] = responses[i] as [Error | null, Record<string, string>];
                if (!err && data && data['region']) {
                    results.set(userIds[i]!, {
                        region: data['region'],
                        socketId: data['socketId'] || null,
                        podId: data['podId'] || null,
                    });
                }
            }
        }

        return results;
    }

    /**
     * Clean up all presence entries for a specific pod (used during graceful shutdown)
     */
    async cleanupPodPresence(podId: string): Promise<number> {
        // In production, this would scan for all keys belonging to this pod
        // For now, we log and return 0 — the TTL-based expiry handles cleanup
        console.log(`[Presence] Cleaning up presence for pod ${podId}`);
        return 0;
    }
}

export const presenceService = new PresenceService();
