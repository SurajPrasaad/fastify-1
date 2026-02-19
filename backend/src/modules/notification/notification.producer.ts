
import { getRabbitChannel, QUEUES } from "../../config/rabbitmq.js";
import type { SendNotificationInput } from "./notification.dto.js";

/**
 * RabbitMQ Producer for Notifications.
 * 
 * Scalability Logic:
 * Instead of processing notification logic (DB writes, FCM calls) during 
 * high-throughput events (like a viral post getting 1000 likes/sec), 
 * we offload the event to a queue. This ensures the main API remains responsive.
 */
export class NotificationProducer {
    /**
     * Pushes a notification event to RabbitMQ.
     * 
     * Durability Guarantee:
     * 1. The Queue is declared as 'durable' (survives broker restart).
     * 2. Messages are sent with 'persistent: true' (stored on disk).
     */
    static async sendNotificationEvent(payload: SendNotificationInput) {
        try {
            const channel = await getRabbitChannel();

            // Ensure the queue exists and is durable
            await channel.assertQueue(QUEUES.NOTIFICATIONS, { durable: true });

            const message = JSON.stringify(payload);

            const success = channel.sendToQueue(QUEUES.NOTIFICATIONS, Buffer.from(message), {
                persistent: true // Ensure message is saved to disk
            });

            if (!success) {
                console.error("❌ RabbitMQ buffer full, could not send event");
                return false;
            }

            return true;
        } catch (error) {
            console.error("❌ NotificationProducer Error:", error);
            return false;
        }
    }
}
