import { redis } from "../../config/redis.js";
import { NotificationRepository } from "./notification.repository.js";
import { getRabbitChannel, QUEUES } from "../../config/rabbitmq.js";
export class NotificationService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    /**
     * Primary entry point for all notification events
     * Orchestrates: Deduplication -> Persistence -> Fan-out to Channels
     */
    async handleEvent(event) {
        const { recipientId, actorId, templateSlug, entityType, entityId, data } = event;
        // 1. Resolve Template
        const template = await this.repository.getTemplateBySlug(templateSlug);
        if (!template)
            throw new Error(`Template not found: ${templateSlug}`);
        // 2. Redis-based Deduplication (Viral Protection)
        // Window: 5 minutes. Key: notif:dedupe:{userId}:{templateId}:{entityId}
        const dedupeKey = `notif:dedupe:${recipientId}:${template.id}:${entityId}`;
        const isDuplicate = await redis.get(dedupeKey);
        if (isDuplicate) {
            // Aggregation Logic: Update existing in-app notification count
            const existing = await this.repository.findAggregatableNotification(recipientId, entityId, entityType);
            if (existing) {
                const newCount = (existing.metaData?.count || 1) + 1;
                const message = this.hydrateTemplate(template.bodyTemplate, { ...data, count: newCount });
                await this.repository.updateNotification(existing.id, {
                    message,
                    metaData: { ...existing.metaData, count: newCount, lastActorId: actorId ?? undefined }
                });
                // Still notify WS for real-time count updates
                await this.notifyInApp(recipientId, { id: existing.id, message, count: newCount });
                return;
            }
        }
        // 3. New Notification Flow
        const message = this.hydrateTemplate(template.bodyTemplate, { ...data, count: 1 });
        const notification = await this.repository.createNotification({
            recipientId,
            actorId: actorId ?? undefined,
            templateId: template.id,
            entityType,
            entityId,
            message,
            metaData: { ...event.metaData, count: 1 }
        });
        if (!notification)
            throw new Error("Failed to create notification");
        // Set Dedupe Lock
        await redis.set(dedupeKey, "1", "EX", 300);
        // 4. Multi-Channel Fan-out
        // Check preferences and enqueue delivery jobs
        const channels = await this.resolveEnabledChannels(recipientId, template.id);
        for (const channel of channels) {
            await this.enqueueDelivery(channel, {
                notificationId: notification.id,
                recipientId,
                title: this.hydrateTemplate(template.titleTemplate, data),
                message,
                metaData: notification.metaData
            });
        }
    }
    hydrateTemplate(template, data = {}) {
        return template.replace(/\{\{(.*?)\}\}/g, (_, key) => data[key.trim()] || "");
    }
    async resolveEnabledChannels(userId, templateId) {
        const enabled = [];
        // 1. Check Global Settings
        const settings = await this.repository.getUserSettings(userId);
        // 2. Check Quiet Hours
        if (this.isQuietHours(settings)) {
            return ["IN_APP"]; // Only in-app during quiet hours
        }
        // 3. Check specific template + channel preferences
        const channels = ["PUSH", "EMAIL", "IN_APP"];
        for (const channel of channels) {
            const isEnabled = await this.repository.isChannelEnabled(userId, templateId, channel);
            if (isEnabled)
                enabled.push(channel);
        }
        return enabled;
    }
    isQuietHours(settings) {
        if (!settings.quietHoursStart || !settings.quietHoursEnd)
            return false;
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const [startH, startM] = settings.quietHoursStart.split(':').map(Number);
        const [endH, endM] = settings.quietHoursEnd.split(':').map(Number);
        const startTime = startH * 60 + startM;
        const endTime = endH * 60 + endM;
        if (startTime < endTime) {
            return currentTime >= startTime && currentTime <= endTime;
        }
        else {
            // Overlap midnight
            return currentTime >= startTime || currentTime <= endTime;
        }
    }
    async enqueueDelivery(channel, payload) {
        const rabbitChannel = await getRabbitChannel();
        const queueName = `notification_delivery_${channel.toLowerCase()}`;
        await rabbitChannel.assertQueue(queueName, { durable: true });
        rabbitChannel.sendToQueue(queueName, Buffer.from(JSON.stringify(payload)), {
            persistent: true,
            headers: { 'x-delay': 0 } // Support for delayed queues if needed
        });
    }
    async notifyInApp(userId, data) {
        await redis.publish("events:notifications", JSON.stringify({ userId, ...data }));
    }
    // --- User Facing Methods ---
    async getNotifications(userId, limit, cursor) {
        return this.repository.getNotifications(userId, limit, cursor);
    }
    async registerDevice(userId, input) {
        return this.repository.registerDevice(userId, input);
    }
    async markRead(id, userId) {
        return this.repository.markAsRead(id, userId);
    }
}
//# sourceMappingURL=notification.service.js.map