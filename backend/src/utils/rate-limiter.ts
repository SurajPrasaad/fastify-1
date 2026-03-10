import { redis } from '../config/redis.js';

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    reset: number;
    limit: number;
}

/**
 * Advanced Redis sliding window rate limiter.
 * This prevents the "burst at the edge" problem of fixed window rate limiters.
 */
export async function checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number
): Promise<RateLimitResult> {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const minTimestamp = now - windowMs;

    // Redis transaction using Lua script for atomicity and performance
    // 1. Remove old requests outside current window
    // 2. Count remaining requests
    // 3. Add current request if under limit
    const luaScript = `
        local key = KEYS[1]
        local now = tonumber(ARGV[1])
        local window = tonumber(ARGV[2])
        local limit = tonumber(ARGV[3])
        local minTimestamp = now - window

        -- Remove expired timestamps
        redis.call('ZREMRANGEBYSCORE', key, 0, minTimestamp)

        -- Current request count
        local count = redis.call('ZCARD', key)

        if count < limit then
            -- Add current request
            redis.call('ZADD', key, now, now)
            redis.call('EXPIRE', key, window / 1000 + 1)
            return {1, limit - count - 1, window / 1000}
        else
            -- Limit exceeded
            return {0, 0, window / 1000}
        end
    `;

    const result = await redis.eval(luaScript, 1, key, now, windowMs, limit) as [number, number, number];

    return {
        allowed: result[0] === 1,
        remaining: result[1],
        reset: result[2],
        limit: limit
    };
}

/**
 * Get tier-based rate limit keys and config
 */
export function getRateLimitConfig(type: 'API' | 'SEARCH' | 'AUTH', userId?: string, ip?: string) {
    const isAuth = !!userId;
    const identifier = userId || ip || 'anonymous';

    const configs = {
        API: {
            limit: isAuth ? 300 : 60,
            window: 60, // 1 minute
            key: `ratelimit:api:${identifier}`
        },
        SEARCH: {
            limit: isAuth ? 30 : 10,
            window: 60, // 1 minute
            key: `ratelimit:search:${identifier}`
        },
        AUTH: {
            limit: 5,
            window: 300, // 5 minutes for login/signup attempts
            key: `ratelimit:auth:${identifier}`
        }
    };

    return configs[type];
}

/**
 * Fastify hook for rate limiting. 
 * Use it in controller routes to protect them.
 */
export async function rateLimitHook(
    request: any,
    reply: any,
    type: 'API' | 'SEARCH' | 'AUTH' = 'API'
) {
    const config = getRateLimitConfig(type, request.session?.userId, request.ip);
    const result = await checkRateLimit(config.key, config.limit, config.window);

    reply.header('X-RateLimit-Limit', result.limit);
    reply.header('X-RateLimit-Remaining', result.remaining);
    reply.header('X-RateLimit-Reset', result.reset);

    if (!result.allowed) {
        return reply.code(429).send({
            error: "Too Many Requests",
            message: `Rate limit exceeded. Try again in ${result.reset} seconds.`,
            retryAfter: result.reset
        });
    }
}
