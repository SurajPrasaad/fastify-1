import type { FastifyInstance } from "fastify";
import type { Socket, Server } from "socket.io";

import { redis } from "../../config/redis.js";
import { Redis } from "ioredis";
import jwt from "jsonwebtoken";
import { publicKey } from "../../config/keys.js";

/**
 * Enterprise Notification Gateway (Socket.IO)
 */
export async function notificationGateway(fastify: FastifyInstance) {
    const io = (fastify as any).io as Server;
    const nsp = io.of("/notifications");

    // Middleware: Authentication
    nsp.use((socket: Socket, next: (err?: Error) => void) => {
        const token = socket.handshake.query.token as string ||
            socket.handshake.auth.token as string ||
            socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
            return next(new Error('Authentication error: Token missing'));
        }

        try {
            const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as { sub: string };
            socket.data.userId = decoded.sub;
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    // Redis Subscriber for cross-node notifications
    const subscriber = redis.duplicate();
    subscriber.subscribe("events:notifications", (err) => {
        if (err) console.error("Failed to subscribe to notifications channel:", err);
    });

    subscriber.on("message", (channel, message) => {
        if (channel === "events:notifications") {
            try {
                const event = JSON.parse(message);
                const userId = event.recipientId || event.userId;
                if (userId) {
                    nsp.to(`u:${userId}`).emit("notification:new", event);
                }
            } catch (error) {
                console.error("Failed to parse notification message", error);
            }
        }
    });

    nsp.on("connection", (socket: Socket) => {
        const userId = socket.data.userId;

        // Join personal room for targeted events
        socket.join(`u:${userId}`);

        console.log(`🔌 User ${userId} connected to notification namespace`);

        // Send initial connection acknowledgment
        socket.emit("connection:established", {
            userId,
            connectedAt: new Date().toISOString()
        });

        socket.on("disconnect", () => {
            console.log(`User ${userId} disconnected from notification namespace`);
        });

        socket.on("notification:ack", (data: any) => {

            // ACK handled if needed
        });
    });

    return {
        isUserOnline: async (userId: string) => {
            const sockets = await nsp.in(`u:${userId}`).fetchSockets();
            return sockets.length > 0;
        }
    };
}
