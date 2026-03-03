/**
 * Signaling Rate Limiter — Per-event rate limiting for WebSocket signaling
 * Uses Redis sliding window counters per user per event type.
 */

import { redis } from '../../config/redis.js';

interface RateLimitConfig {
    maxRequests: number;
    windowSeconds: number;
}

/**
 * Rate limit configuration per signaling event type
 * From architecture spec:
 *   call:initiate → 1 per 5s
 *   webrtc:offer → 1 per 10s per call
 *   ice-candidate → 50 per 30s per call
 *   heartbeat → 1 per 25s per socket
 */
const EVENT_LIMITS: Record<string, RateLimitConfig> = {
    'call:initiate': { maxRequests: 1, windowSeconds: 5 },
    'call:accept': { maxRequests: 2, windowSeconds: 5 },
    'call:reject': { maxRequests: 2, windowSeconds: 5 },
    'call:end': { maxRequests: 2, windowSeconds: 5 },
    'webrtc:offer': { maxRequests: 1, windowSeconds: 10 },
    'webrtc:answer': { maxRequests: 1, windowSeconds: 10 },
    'webrtc:ice-candidate': { maxRequests: 50, windowSeconds: 30 },
    'call:heartbeat': { maxRequests: 1, windowSeconds: 25 },
    'call:quality': { maxRequests: 1, windowSeconds: 5 },
};

/** Payload size limits (bytes) */
const PAYLOAD_LIMITS: Record<string, number> = {
    'webrtc:offer': 10240,  // 10KB for SDP
    'webrtc:answer': 10240,
    'webrtc:ice-candidate': 1024,   // 1KB for ICE
    'call:quality': 2048,   // 2KB for telemetry
};

export class SignalingRateLimiter {

    /**
     * Check if a user is within rate limits for a specific event
     * Returns true if allowed, false if rate limited
     */
    async checkLimit(userId: string, eventType: string): Promise<boolean> {
        const config = EVENT_LIMITS[eventType];
        if (!config) return true; // No limit configured — allow

        const key = `ratelimit:${eventType}:${userId}`;
        const current = await redis.incr(key);

        if (current === 1) {
            // First request in window — set expiry
            await redis.expire(key, config.windowSeconds);
        }

        return current <= config.maxRequests;
    }

    /**
     * Validate payload size for a specific event
     */
    validatePayloadSize(eventType: string, payload: unknown): boolean {
        const maxSize = PAYLOAD_LIMITS[eventType];
        if (!maxSize) return true; // No limit

        const size = Buffer.byteLength(JSON.stringify(payload), 'utf8');
        return size <= maxSize;
    }

    /**
     * Get remaining requests for a user/event
     */
    async getRemainingRequests(
        userId: string,
        eventType: string,
    ): Promise<{ remaining: number; resetIn: number }> {
        const config = EVENT_LIMITS[eventType];
        if (!config) return { remaining: Infinity, resetIn: 0 };

        const key = `ratelimit:${eventType}:${userId}`;
        const [current, ttl] = await Promise.all([
            redis.get(key),
            redis.ttl(key),
        ]);

        return {
            remaining: Math.max(0, config.maxRequests - Number(current || 0)),
            resetIn: Math.max(0, ttl),
        };
    }
}

export const signalingRateLimiter = new SignalingRateLimiter();
