import { getRabbitChannel } from "../../config/rabbitmq.js";
import { FcmService } from "./fcm.service.js";
import { WebPushService } from "./web-push.service.js";

/**
 * Notification Delivery Workers
 *
 * Background workers that consume from RabbitMQ queues
 * and deliver notifications via push (FCM) and email.
 */
export async function startDeliveryWorkers() {
    const fcmService = new FcmService();
    const webPushService = new WebPushService();

    try {
        let channel = await getRabbitChannel();

        // ─── Helper: safely assert a queue (handles 406 PRECONDITION_FAILED) ─
        async function safeAssertQueue(queueName: string) {
            try {
                await channel.assertQueue(queueName, { durable: true });
            } catch (err: any) {
                if (err?.code === 406) {
                    console.warn(
                        `⚠️ Queue "${queueName}" exists with different properties — recreating channel`
                    );
                    // Channel is closed after a failed assertQueue, get a fresh one
                    channel = await getRabbitChannel();

                    // Try without durable flag to match existing queue
                    try {
                        await channel.checkQueue(queueName);
                    } catch {
                        // Queue doesn't exist at all, create it fresh
                        channel = await getRabbitChannel();
                        await channel.assertQueue(queueName, { durable: false });
                    }
                } else {
                    throw err;
                }
            }
        }

        // ─── PUSH Notification Worker ───────────────────────────────────────
        const pushQueue = "notification_delivery_push";
        await safeAssertQueue(pushQueue);

        channel.prefetch(10);

        console.log("✅ Push Notification Worker started, waiting for messages...");

        channel.consume(
            pushQueue,
            async (msg) => {
                if (!msg) return;

                try {
                    const payload = JSON.parse(msg.content.toString());
                    const { recipientId, title, message, metaData, notificationId } = payload;

                    const data: Record<string, string> = {};
                    if (metaData?.actionUrl) data.actionUrl = metaData.actionUrl;
                    if (notificationId) data.notificationId = notificationId;

                    const successCount = await fcmService.sendToAllDevices(
                        recipientId,
                        title || "New Notification",
                        message,
                        data
                    );

                    const webPushCount = await webPushService.sendToAllDevices(
                        recipientId,
                        title || "New Notification",
                        message,
                        data
                    );

                    console.log(
                        `📨 Push sent to ${successCount} FCM device(s) and ${webPushCount} Web device(s) for user ${recipientId}`
                    );

                    channel.ack(msg);
                } catch (err) {
                    console.error("Push Worker Error:", err);
                    channel.nack(msg, false, true);
                }
            },
            { noAck: false }
        );

        // ─── EMAIL Notification Worker (placeholder) ────────────────────────
        const emailQueue = "notification_delivery_email";
        await safeAssertQueue(emailQueue);

        console.log("✅ Email Notification Worker started, waiting for messages...");

        channel.consume(
            emailQueue,
            async (msg) => {
                if (!msg) return;

                try {
                    const payload = JSON.parse(msg.content.toString());
                    const { recipientId, title } = payload;

                    // TODO: Integrate with email service (SES, SendGrid, etc.)
                    console.log(`📧 Email notification for user ${recipientId}: ${title}`);

                    channel.ack(msg);
                } catch (err) {
                    console.error("Email Worker Error:", err);
                    channel.nack(msg, false, true);
                }
            },
            { noAck: false }
        );

    } catch (err) {
        console.error(
            "❌ Failed to start delivery workers:",
            (err as Error).message
        );
        // Don't crash the server if workers fail to start
    }
}

// Auto-start if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    startDeliveryWorkers().catch(console.error);
}
