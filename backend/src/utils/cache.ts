import { redis } from "../config/redis.js";

/**
 * Cache Singleflight (Single Request Fetching)
 * 
 * Ensures that for a given key, only one execution of the fetcher function 
 * happens at a time across all server instances. Others will wait and 
 * return the result from the cache once populated.
 */
export async function getOrSetWithLock<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600
): Promise<T> {
    // 1. Try to get from cache first
    const cached = await redis.get(key);
    if (cached) {
        try {
            return JSON.parse(cached);
        } catch (e) {
            console.error(`❌ Failed to parse cache for key ${key}:`, e);
        }
    }

    // 2. Cache Miss - Try to acquire a distributed lock in Redis
    const lockKey = `lock:${key}`;
    // Lock expires in 10 seconds to prevent deadlocks if the fetcher crashes
    const lock = await redis.set(lockKey, "locked", "EX", 10, "NX");

    if (lock === "OK") {
        try {
            // I am the winner of the race, I fetch the data
            const data = await fetcher();
            // Store result in cache
            if (data !== undefined && data !== null) {
                await redis.set(key, JSON.stringify(data), "EX", ttl);
            }
            return data;
        } finally {
            // Unlock immediately after setting the cache
            await redis.del(lockKey);
        }
    } else {
        // I lost the race, wait for 200ms and try again
        // Max retries could be added, but for simple use cases this is fine
        await new Promise(resolve => setTimeout(resolve, 200));
        return getOrSetWithLock(key, fetcher, ttl);
    }
}
