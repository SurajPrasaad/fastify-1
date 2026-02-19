import { redis } from "../../config/redis.js";
import { Redis } from "ioredis";
export class NotificationGateway {
    connections = new Map();
    subscriber;
    constructor() {
        // subscribers need their own connection
        this.subscriber = redis.duplicate();
        this.initRedis();
    }
    initRedis() {
        this.subscriber.subscribe("events:notifications", (err) => {
            if (err)
                console.error("Failed to subscribe to notifications channel:", err);
            else
                console.log("✅ Subscribed to events:notifications");
        });
        this.subscriber.on("message", (channel, message) => {
            if (channel === "events:notifications") {
                this.handleRedisMessage(message);
            }
        });
        this.subscriber.on("error", (err) => {
            console.error("Redis Subscriber Error:", err);
        });
    }
    handleRedisMessage(message) {
        try {
            const event = JSON.parse(message);
            this.sendToUser(event.recipientId, event);
        }
        catch (error) {
            console.error("Failed to parse notification message", error);
        }
    }
    handleConnection(socket, req) {
        // Authenticate Query Token
        // In a real app, verifying JWT token here or via preValidation hook
        // Assuming 'req.user' is populated if using preValidation or manually checking:
        // const token = req.query.token;
        // For this standard request, let's assume `req.user` is available if we use standard auth middleware on the route
        // But WS upgrade requests often need query param auth since headers are tricky in some clients
        // Using simple mock or relying on `req.user` if `websocket` route supports fastify middleware
        // Fastify-websocket routes can have `preHandler`.
        // I'll assume `req.user.id` is present from the route handler wrapper
        const userId = req.user?.id;
        if (!userId) {
            socket.close(1008, "Unauthorized");
            return;
        }
        // Store connection
        this.connections.set(userId, socket);
        console.log(`🔌 User ${userId} connected to WS`);
        // Handle incoming messages (e.g. Ping/Pong)
        socket.on("message", (data) => {
            try {
                const msg = JSON.parse(data.toString());
                if (msg.type === "ping") {
                    socket.send(JSON.stringify({ type: "pong" }));
                }
            }
            catch (e) {
                // ignore malformed
            }
        });
        socket.on("close", () => {
            this.connections.delete(userId);
            console.log(`User ${userId} disconnected`);
        });
        socket.on("error", (err) => {
            console.error(`WS Error for user ${userId}:`, err);
            this.connections.delete(userId);
        });
    }
    sendToUser(userId, event) {
        const socket = this.connections.get(userId);
        if (socket && socket.readyState === socket.OPEN) {
            try {
                socket.send(JSON.stringify(event));
            }
            catch (err) {
                console.error(`Failed to send WS message to ${userId}`, err);
                this.connections.delete(userId);
            }
        }
    }
}
//# sourceMappingURL=notification.gateway.js.map