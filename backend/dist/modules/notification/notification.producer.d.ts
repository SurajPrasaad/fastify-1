import type { SendNotificationInput } from "./notification.dto.js";
/**
 * RabbitMQ Producer for Notifications.
 *
 * Scalability Logic:
 * Instead of processing notification logic (DB writes, FCM calls) during
 * high-throughput events (like a viral post getting 1000 likes/sec),
 * we offload the event to a queue. This ensures the main API remains responsive.
 */
export declare class NotificationProducer {
    /**
     * Pushes a notification event to RabbitMQ.
     *
     * Durability Guarantee:
     * 1. The Queue is declared as 'durable' (survives broker restart).
     * 2. Messages are sent with 'persistent: true' (stored on disk).
     */
    static sendNotificationEvent(payload: SendNotificationInput): Promise<boolean>;
}
//# sourceMappingURL=notification.producer.d.ts.map