import { db } from "../../config/drizzle.js";
import {
    notifications,
    notificationSettings,
    notificationTemplates,
    notificationPreferences,
    deviceTokens,
    deliveryAttempts,
    users,
} from "../../db/schema.js";
import { and, desc, eq, lt, sql, inArray, count } from "drizzle-orm";
import type { NotificationEntityType, DeliveryChannel, NotificationType } from "./notification.dto.js";

export class NotificationRepository {
    // ─── Core CRUD ──────────────────────────────────────────────────────────────

    /**
     * Create a new notification record
     */
    async createNotification(data: {
        recipientId: string;
        actorId?: string | undefined;
        templateId?: string | undefined;
        entityType: NotificationEntityType;
        entityId: string;
        message: string;
        metaData?: any;
        type?: NotificationType; // LIKE | COMMENT | REPLY | MENTION | FOLLOW
        postId?: string | null;
        commentId?: string | null;
    }) {
        const [notification] = await db
            .insert(notifications)
            .values(data)
            .returning();
        return notification;
    }

    /**
     * Check if a duplicate notification already exists within a time window
     * Used for deduplication (e.g., prevent re-sending LIKE notification within 5 min)
     */
    async findDuplicateNotification(
        senderId: string,
        receiverId: string,
        entityId: string,
        entityType: NotificationEntityType,
        windowMinutes: number = 5
    ) {
        const window = new Date(Date.now() - windowMinutes * 60 * 1000);
        const [existing] = await db
            .select()
            .from(notifications)
            .where(
                and(
                    eq(notifications.actorId, senderId),
                    eq(notifications.recipientId, receiverId),
                    eq(notifications.entityId, entityId),
                    eq(notifications.entityType, entityType),
                    sql`${notifications.createdAt} > ${window}`
                )
            )
            .limit(1);
        return existing;
    }

    /**
     * Find an aggregatable notification for count updates (viral protection)
     */
    async findAggregatableNotification(
        recipientId: string,
        entityId: string,
        entityType: NotificationEntityType
    ) {
        const window = new Date(Date.now() - 5 * 60 * 1000);
        const [notification] = await db
            .select()
            .from(notifications)
            .where(
                and(
                    eq(notifications.recipientId, recipientId),
                    eq(notifications.entityId, entityId),
                    eq(notifications.entityType, entityType),
                    sql`${notifications.createdAt} > ${window}`
                )
            )
            .orderBy(desc(notifications.createdAt))
            .limit(1);
        return notification;
    }

    /**
     * Update a notification (for aggregation count updates)
     */
    async updateNotification(
        id: string,
        data: {
            message?: string;
            metaData?: {
                count?: number | undefined;
                lastActorId?: string | undefined;
                actionUrl?: string | undefined;
                image?: string | undefined;
            };
        }
    ) {
        const [updated] = await db
            .update(notifications)
            .set(data)
            .where(eq(notifications.id, id))
            .returning();
        return updated;
    }

    // ─── Templates ──────────────────────────────────────────────────────────────

    async getTemplateBySlug(slug: string) {
        const [template] = await db
            .select()
            .from(notificationTemplates)
            .where(eq(notificationTemplates.slug, slug))
            .limit(1);
        return template;
    }

    // ─── Preferences ───────────────────────────────────────────────────────────

    async getUserSettings(userId: string) {
        let [settings] = await db
            .select()
            .from(notificationSettings)
            .where(eq(notificationSettings.userId, userId))
            .limit(1);

        if (!settings) {
            [settings] = await db
                .insert(notificationSettings)
                .values({ userId })
                .returning();
        }
        return settings;
    }

    async isChannelEnabled(
        userId: string,
        templateId: string,
        channel: DeliveryChannel
    ) {
        const [pref] = await db
            .select()
            .from(notificationPreferences)
            .where(
                and(
                    eq(notificationPreferences.userId, userId),
                    eq(notificationPreferences.templateId, templateId),
                    eq(notificationPreferences.channel, channel)
                )
            )
            .limit(1);

        if (pref) return pref.isEnabled;

        // Default to template's default if no specific preference
        const [template] = await db
            .select()
            .from(notificationTemplates)
            .where(eq(notificationTemplates.id, templateId))
            .limit(1);

        if (!template) return false;

        if (channel === "PUSH") return template.isPushEnabled;
        if (channel === "EMAIL") return template.isEmailEnabled;
        if (channel === "IN_APP") return template.isInAppEnabled;

        return true;
    }

    // ─── Device Tokens (FCM) ───────────────────────────────────────────────────

    async getActiveDeviceTokens(userId: string) {
        return await db
            .select()
            .from(deviceTokens)
            .where(
                and(eq(deviceTokens.userId, userId), eq(deviceTokens.isActive, true))
            );
    }

    async registerDevice(
        userId: string,
        data: {
            token: string;
            platform: "IOS" | "ANDROID" | "WEB";
            deviceId?: string | undefined;
        }
    ) {
        await db
            .insert(deviceTokens)
            .values({ userId, ...data })
            .onConflictDoUpdate({
                target: [deviceTokens.userId, deviceTokens.token],
                set: { isActive: true, lastUsedAt: new Date() },
            });
    }

    async deactivateDeviceToken(token: string) {
        await db
            .update(deviceTokens)
            .set({ isActive: false })
            .where(eq(deviceTokens.token, token));
    }

    // ─── Delivery Tracking ────────────────────────────────────────────────────

    async logDeliveryAttempt(data: typeof deliveryAttempts.$inferInsert) {
        return await db.insert(deliveryAttempts).values(data).returning();
    }

    async updateDeliveryStatus(
        id: string,
        status: "SENT" | "FAILED" | "PERMANENT_FAILURE",
        error?: string
    ) {
        await db
            .update(deliveryAttempts)
            .set({ status, error })
            .where(eq(deliveryAttempts.id, id));
    }

    // ─── Retrieval ────────────────────────────────────────────────────────────

    /**
     * Get paginated notifications with sender info (JOIN users)
     */
    async getNotifications(
        userId: string,
        limit: number,
        cursor?: string,
        type?: string
    ) {
        const conditions = [eq(notifications.recipientId, userId)];

        if (cursor) {
            conditions.push(lt(notifications.createdAt, new Date(cursor)));
        }

        // Specific type filter (LIKE, COMMENT, REPLY, MENTION, FOLLOW)
        if (type) {
            conditions.push(eq(notifications.type, type as any));
        }

        const results = await db
            .select({
                id: notifications.id,
                recipientId: notifications.recipientId,
                actorId: notifications.actorId,
                type: notifications.type,
                entityType: notifications.entityType,
                entityId: notifications.entityId,
                postId: notifications.postId,
                commentId: notifications.commentId,
                message: notifications.message,
                isRead: notifications.isRead,
                metaData: notifications.metaData,
                createdAt: notifications.createdAt,
                // Sender info from JOIN
                senderUsername: users.username,
                senderName: users.name,
                senderAvatarUrl: users.avatarUrl,
            })
            .from(notifications)
            .leftJoin(users, eq(notifications.actorId, users.id))
            .where(and(...conditions))
            .orderBy(desc(notifications.createdAt))
            .limit(limit);

        return results.map((r) => ({
            id: r.id,
            recipientId: r.recipientId,
            actorId: r.actorId,
            type: r.type,
            entityType: r.entityType,
            entityId: r.entityId,
            postId: r.postId,
            commentId: r.commentId,
            message: r.message,
            isRead: r.isRead,
            metaData: r.metaData,
            createdAt: r.createdAt,
            sender: r.actorId
                ? {
                    id: r.actorId,
                    username: r.senderUsername || "",
                    name: r.senderName || "",
                    avatarUrl: r.senderAvatarUrl || undefined,
                }
                : undefined,
        }));
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount(userId: string): Promise<number> {
        const [result] = await db
            .select({ count: count() })
            .from(notifications)
            .where(
                and(
                    eq(notifications.recipientId, userId),
                    eq(notifications.isRead, false)
                )
            );
        return result?.count || 0;
    }

    /**
     * Mark a single notification as read
     */
    async markAsRead(id: string, userId: string) {
        const [updated] = await db
            .update(notifications)
            .set({ isRead: true })
            .where(
                and(
                    eq(notifications.id, id),
                    eq(notifications.recipientId, userId)
                )
            )
            .returning();
        return updated;
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string) {
        const result = await db
            .update(notifications)
            .set({ isRead: true })
            .where(
                and(
                    eq(notifications.recipientId, userId),
                    eq(notifications.isRead, false)
                )
            );
        return result;
    }

    // ─── User Lookup ──────────────────────────────────────────────────────────

    /**
     * Get sender info by userId (for WebSocket payloads)
     */
    async getUserById(userId: string) {
        const [user] = await db
            .select({
                id: users.id,
                username: users.username,
                name: users.name,
                avatarUrl: users.avatarUrl,
            })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
        return user;
    }
}
