import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import { redis } from '../config/redis.js';
export default fp(async (fastify) => {
    await fastify.register(rateLimit, {
        max: 100,
        timeWindow: '1 minute',
        redis: redis, // Use the shared Redis instance
        errorResponseBuilder: (request, context) => {
            return {
                statusCode: 429,
                error: 'Too Many Requests',
                message: `I only allow ${context.max} requests per ${context.after}. Try again soon.`,
                date: new Date(),
                expiresIn: context.ttl
            };
        }
    });
});
//# sourceMappingURL=rate-limit.js.map