
import type { FastifyInstance } from 'fastify';
import { Server } from 'socket.io';
import { Redis } from 'ioredis';
import { createAdapter } from "@socket.io/redis-adapter";

/**
 * Socket.io Scalability Plugin
 * Configures Redis Adapter for multi-node support and global middleware.
 */
export default async function socketPlugin(fastify: FastifyInstance) {
    // Wait for fastify-socket.io to be ready
    fastify.ready((err) => {
        if (err) return;

        const io = (fastify as any).io as Server;
        if (!io) return;

        const subRedis = new Redis({
            host: process.env.REDIS_HOST || '127.0.0.1',
            port: Number(process.env.REDIS_PORT) || 6379,
        });
        const pubRedis = subRedis.duplicate();

        // Enable Redis Adapter for high-availability
        io.adapter(createAdapter(pubRedis, subRedis));

        fastify.log.info('Socket.io Redis Adapter initialized for multi-node scalability');
    });
}
