import { Redis } from 'ioredis';
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = Number(process.env.REDIS_PORT) || 6379;
export const redis = new Redis({
    host: redisHost,
    port: redisPort,
    retryStrategy: (times) => {
        return Math.min(times * 50, 2000);
    }
});
redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err));
//# sourceMappingURL=redis.js.map