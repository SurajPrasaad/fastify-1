import { getRabbitChannel } from "../../config/rabbitmq.js";
import { NotificationRepository } from "./notification.repository.js";
import { FcmService } from "./fcm.service.js"; // Existing
import { AppError } from "../../utils/AppError.js";
const repo = new NotificationRepository();
const fcm = new FcmService();
const MAX_RETRIES = 3;
/**
 * Delivery Workers Pool
 * Scalable independently based on channel volume (e.g., more EMAIL workers than PUSH)
 */
export async function startDeliveryWorkers() {
    const channel = await getRabbitChannel();
    // 1. Push Delivery Worker
    await setupWorker(channel, "notification_delivery_push", async (data) => {
        const tokens = await repo.getActiveDeviceTokens(data.recipientId);
        for (const device of tokens) {
            await repo.logDeliveryAttempt({
                notificationId: data.notificationId,
                channel: "PUSH",
                status: "PENDING",
                traceId: data.traceId
            });
            try {
                // In a production environment, we'd batch these for FCM
                await fcm.sendToDevice(device.token, data.title, data.message, data.metaData);
                await repo.updateDeliveryStatus(data.notificationId, "SENT");
            }
            catch (err) {
                console.error(`❌ Push Error for user ${data.recipientId}:`, err.message);
                throw err; // Trigger retry
            }
        }
    });
    // 2. Email Delivery Worker
    await setupWorker(channel, "notification_delivery_email", async (data) => {
        const settings = await repo.getUserSettings(data.recipientId);
        if (!settings || !settings.emailEnabled)
            return;
        try {
            // Mock SES Integration
            console.log(`[SES] Sending Email to user ${data.recipientId}: ${data.message}`);
            await repo.logDeliveryAttempt({
                notificationId: data.notificationId,
                channel: "EMAIL",
                status: "SENT"
            });
        }
        catch (err) {
            console.error(`❌ Email Error:`, err.message);
            throw err;
        }
    });
}
async function setupWorker(channel, queueName, processor) {
    const dlq = `${queueName}_dlq`;
    // Setup Main Queue & DLQ
    await channel.assertQueue(dlq, { durable: true });
    await channel.assertQueue(queueName, {
        durable: true,
        arguments: {
            'x-dead-letter-exchange': '',
            'x-dead-letter-routing-key': dlq
        }
    });
    await channel.prefetch(10); // Batch size for high throughput
    channel.consume(queueName, async (msg) => {
        if (!msg)
            return;
        const data = JSON.parse(msg.content.toString());
        const retryCount = (msg.properties.headers['x-retry-count'] || 0);
        try {
            await processor(data);
            channel.ack(msg);
        }
        catch (error) {
            if (retryCount < MAX_RETRIES) {
                console.warn(`⚠️ Retrying ${queueName} (${retryCount + 1}/${MAX_RETRIES})`);
                // Exponential Backoff implementation (simplified)
                setTimeout(() => {
                    channel.sendToQueue(queueName, msg.content, {
                        headers: { 'x-retry-count': retryCount + 1 }
                    });
                    channel.ack(msg);
                }, Math.pow(2, retryCount) * 1000);
            }
            else {
                console.error(`☠️ Permanent Failure for ${queueName}. Moving to DLQ.`);
                channel.nack(msg, false, false); // Sends to DLQ
                await repo.updateDeliveryStatus(data.notificationId, "PERMANENT_FAILURE", error.message);
            }
        }
    });
}
//# sourceMappingURL=notification.worker.js.map