import { db } from "../../config/drizzle.js";
import { notifications, notificationSettings, notificationTemplates, notificationPreferences, deviceTokens, deliveryAttempts, users } from "../../db/schema.js";
import { and, desc, eq, lt, sql, or } from "drizzle-orm";
export class NotificationRepository {
    // --- Persistence ---
    async createNotification(data) {
        const [notification] = await db.insert(notifications).values(data).returning();
        return notification;
    }
    async findAggregatableNotification(recipientId, entityId, entityType) {
        const window = new Date(Date.now() - 5 * 60 * 1000); // 5 minute window for deduplication
        const [notification] = await db
            .select()
            .from(notifications)
            .where(and(eq(notifications.recipientId, recipientId), eq(notifications.entityId, entityId), eq(notifications.entityType, entityType), sql `${notifications.createdAt} > ${window}`))
            .orderBy(desc(notifications.createdAt))
            .limit(1);
        return notification;
    }
    async updateNotification(id, data) {
        const [updated] = await db
            .update(notifications)
            .set(data)
            .where(eq(notifications.id, id))
            .returning();
        return updated;
    }
    // --- Templates ---
    async getTemplateBySlug(slug) {
        const [template] = await db
            .select()
            .from(notificationTemplates)
            .where(eq(notificationTemplates.slug, slug))
            .limit(1);
        return template;
    }
    // --- Preferences ---
    async getUserSettings(userId) {
        let [settings] = await db
            .select()
            .from(notificationSettings)
            .where(eq(notificationSettings.userId, userId))
            .limit(1);
        if (!settings) {
            [settings] = await db.insert(notificationSettings).values({ userId }).returning();
        }
        return settings;
    }
    async isChannelEnabled(userId, templateId, channel) {
        // Check specific preference
        const [pref] = await db
            .select()
            .from(notificationPreferences)
            .where(and(eq(notificationPreferences.userId, userId), eq(notificationPreferences.templateId, templateId), eq(notificationPreferences.channel, channel)))
            .limit(1);
        if (pref)
            return pref.isEnabled;
        // Default to template's default if no specific preference
        const [template] = await db
            .select()
            .from(notificationTemplates)
            .where(eq(notificationTemplates.id, templateId))
            .limit(1);
        if (!template)
            return false;
        if (channel === 'PUSH')
            return template.isPushEnabled;
        if (channel === 'EMAIL')
            return template.isEmailEnabled;
        if (channel === 'IN_APP')
            return template.isInAppEnabled;
        return true;
    }
    // --- Media / Push Tokens ---
    async getActiveDeviceTokens(userId) {
        return await db
            .select()
            .from(deviceTokens)
            .where(and(eq(deviceTokens.userId, userId), eq(deviceTokens.isActive, true)));
    }
    async registerDevice(userId, data) {
        await db
            .insert(deviceTokens)
            .values({ userId, ...data })
            .onConflictDoUpdate({
            target: [deviceTokens.userId, deviceTokens.token],
            set: { isActive: true, lastUsedAt: new Date() }
        });
    }
    // --- Delivery Tracking ---
    async logDeliveryAttempt(data) {
        return await db.insert(deliveryAttempts).values(data).returning();
    }
    async updateDeliveryStatus(id, status, error) {
        await db
            .update(deliveryAttempts)
            .set({ status, error })
            .where(eq(deliveryAttempts.id, id));
    }
    // --- Retrieval ---
    async getNotifications(userId, limit, cursor) {
        return await db
            .select()
            .from(notifications)
            .where(and(eq(notifications.recipientId, userId), cursor ? lt(notifications.createdAt, new Date(cursor)) : undefined))
            .orderBy(desc(notifications.createdAt))
            .limit(limit);
    }
    async markAsRead(id, userId) {
        const [updated] = await db
            .update(notifications)
            .set({ isRead: true })
            .where(and(eq(notifications.id, id), eq(notifications.recipientId, userId)))
            .returning();
        return updated;
    }
    async markAllAsRead(userId) {
        return await db
            .update(notifications)
            .set({ isRead: true })
            .where(eq(notifications.recipientId, userId));
    }
}
//# sourceMappingURL=notification.repository.js.map