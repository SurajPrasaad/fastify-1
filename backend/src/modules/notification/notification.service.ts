import { redis } from "../../config/redis.js";
import { NotificationRepository } from "./notification.repository.js";
import { parseMentions } from "./mention.service.js";
import type {
    CreateNotificationInput,
    SendNotificationInput,
    NotificationWSPayload,
    NotificationEvent,
    RegisterDeviceInput,
    NotificationType,
} from "./notification.dto.js";
import { getRabbitChannel, QUEUES } from "../../config/rabbitmq.js";

export class NotificationService {
    constructor(
        private repository: NotificationRepository = new NotificationRepository()
    ) { }

    // ─────────────────────────────────────────────────────────────────────────
    // NOTIFICATION TRIGGERS — Called from interaction/comment/follow services
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * ① Like → Notify post owner
     */
    async onPostLiked(senderId: string, postOwnerId: string, postId: string, postContent?: string) {
        if (senderId === postOwnerId) return; // Don't self-notify

        const sender = await this.repository.getUserById(senderId);
        if (!sender) return;

        // Deduplication: check if same LIKE notification exists within 5 min
        const duplicate = await this.repository.findDuplicateNotification(
            senderId,
            postOwnerId,
            postId,
            "POST",
            5
        );
        if (duplicate) return;

        const snippet = postContent
            ? postContent.length > 50
                ? postContent.substring(0, 50) + "..."
                : postContent
            : undefined;

        const message = snippet
            ? `${sender.name} liked your post: "${snippet}"`
            : `${sender.name} liked your post`;

        const notification = await this.repository.createNotification({
            recipientId: postOwnerId,
            actorId: senderId,
            entityType: "POST",
            entityId: postId,
            message,
            type: "LIKE",
            postId,
            metaData: {
                actionUrl: `/post/${postId}`,
                image: sender.avatarUrl || undefined,
                snippet,
            },
        });

        if (!notification) return;

        await this.emitRealTimeNotification(postOwnerId, {
            id: notification.id,
            type: "LIKE",
            sender: {
                id: sender.id,
                username: sender.username,
                name: sender.name,
                avatarUrl: sender.avatarUrl || undefined,
            },
            message: notification.message,
            postId,
            createdAt: notification.createdAt.toISOString(),
        });

        await this.enqueuePushNotification(postOwnerId, notification);
    }

    /**
     * ①.b Comment Like → Notify comment owner
     */
    async onCommentLiked(
        senderId: string,
        commentOwnerId: string,
        commentId: string,
        postId: string,
        commentContent?: string
    ) {
        if (senderId === commentOwnerId) return;

        const sender = await this.repository.getUserById(senderId);
        if (!sender) return;

        // Deduplication
        const duplicate = await this.repository.findDuplicateNotification(
            senderId,
            commentOwnerId,
            commentId,
            "COMMENT",
            5
        );
        if (duplicate) return;

        const snippet = commentContent
            ? commentContent.length > 50
                ? commentContent.substring(0, 50) + "..."
                : commentContent
            : undefined;

        const message = snippet
            ? `${sender.name} liked your comment: "${snippet}"`
            : `${sender.name} liked your comment`;

        const notification = await this.repository.createNotification({
            recipientId: commentOwnerId,
            actorId: senderId,
            entityType: "COMMENT",
            entityId: commentId,
            message,
            type: "LIKE",
            postId,
            commentId,
            metaData: {
                actionUrl: `/post/${postId}#comment-${commentId}`,
                image: sender.avatarUrl || undefined,
                snippet,
            },
        });

        if (!notification) return;

        await this.emitRealTimeNotification(commentOwnerId, {
            id: notification.id,
            type: "LIKE",
            sender: {
                id: sender.id,
                username: sender.username,
                name: sender.name,
                avatarUrl: sender.avatarUrl || undefined,
            },
            message: notification.message,
            postId,
            commentId,
            createdAt: notification.createdAt.toISOString(),
        });

        await this.enqueuePushNotification(commentOwnerId, notification);
    }

    /**
     * ② Comment → Notify post owner
     */
    async onCommentCreated(
        senderId: string,
        postOwnerId: string,
        postId: string,
        commentId: string,
        commentContent: string
    ) {
        if (senderId === postOwnerId) return;

        const sender = await this.repository.getUserById(senderId);
        if (!sender) return;

        const snippet =
            commentContent.length > 50
                ? commentContent.substring(0, 50) + "..."
                : commentContent;

        const notification = await this.repository.createNotification({
            recipientId: postOwnerId,
            actorId: senderId,
            entityType: "COMMENT",
            entityId: commentId,
            message: `${sender.name} commented: "${snippet}"`,
            type: "COMMENT",
            postId,
            commentId,
            metaData: {
                actionUrl: `/post/${postId}#comment-${commentId}`,
                snippet,
            },
        });

        if (!notification) return;

        await this.emitRealTimeNotification(postOwnerId, {
            id: notification.id,
            type: "COMMENT",
            sender: {
                id: sender.id,
                username: sender.username,
                name: sender.name,
                avatarUrl: sender.avatarUrl || undefined,
            },
            message: notification.message,
            postId,
            commentId,
            createdAt: notification.createdAt.toISOString(),
        });

        await this.enqueuePushNotification(postOwnerId, notification);

        // Parse mentions in comment content
        await this.onMentionsInText(senderId, commentContent, postId, commentId);
    }

    /**
     * ③ Reply → Notify parent comment owner
     */
    async onReplyCreated(
        senderId: string,
        parentCommentOwnerId: string,
        postId: string,
        commentId: string,
        parentCommentId: string,
        replyContent: string
    ) {
        if (senderId === parentCommentOwnerId) return;

        const sender = await this.repository.getUserById(senderId);
        if (!sender) return;

        const snippet =
            replyContent.length > 50
                ? replyContent.substring(0, 50) + "..."
                : replyContent;

        const notification = await this.repository.createNotification({
            recipientId: parentCommentOwnerId,
            actorId: senderId,
            entityType: "COMMENT",
            entityId: commentId,
            message: `${sender.name} replied: "${snippet}"`,
            type: "REPLY",
            postId,
            commentId,
            metaData: {
                actionUrl: `/post/${postId}#comment-${commentId}`,
                snippet,
            },
        });

        if (!notification) return;

        await this.emitRealTimeNotification(parentCommentOwnerId, {
            id: notification.id,
            type: "REPLY",
            sender: {
                id: sender.id,
                username: sender.username,
                name: sender.name,
                avatarUrl: sender.avatarUrl || undefined,
            },
            message: notification.message,
            postId,
            commentId,
            createdAt: notification.createdAt.toISOString(),
        });

        await this.enqueuePushNotification(parentCommentOwnerId, notification);

        // Parse mentions in reply content
        await this.onMentionsInText(senderId, replyContent, postId, commentId);
    }

    /**
     * ④ Mention (@username) → Notify mentioned user
     */
    async onMentionsInText(
        senderId: string,
        text: string,
        postId: string,
        commentId?: string
    ) {
        const { validUsers } = await parseMentions(text, senderId);

        const sender = await this.repository.getUserById(senderId);
        if (!sender) return;

        for (const mentionedUser of validUsers) {
            // Skip self-mentions
            if (mentionedUser.id === senderId) continue;

            // Deduplication: check if mention notification already exists
            const duplicate = await this.repository.findDuplicateNotification(
                senderId,
                mentionedUser.id,
                commentId || postId,
                "COMMENT",
                5
            );
            if (duplicate) continue;

            const isComment = !!commentId;
            const message = isComment
                ? `${sender.name} mentioned you in a comment`
                : `${sender.name} mentioned you in a post`;

            const notification = await this.repository.createNotification({
                recipientId: mentionedUser.id,
                actorId: senderId,
                entityType: isComment ? "COMMENT" : "POST",
                entityId: commentId || postId,
                message,
                type: "MENTION",
                postId,
                commentId: commentId || null,
                metaData: {
                    actionUrl: isComment
                        ? `/post/${postId}#comment-${commentId}`
                        : `/post/${postId}`,
                },
            });

            if (!notification) continue;

            await this.emitRealTimeNotification(mentionedUser.id, {
                id: notification.id,
                type: "MENTION",
                sender: {
                    id: sender.id,
                    username: sender.username,
                    name: sender.name,
                    avatarUrl: sender.avatarUrl || undefined,
                },
                message: notification.message,
                postId,
                commentId: commentId || null,
                createdAt: notification.createdAt.toISOString(),
            });

            await this.enqueuePushNotification(mentionedUser.id, notification);
        }
    }

    /**
     * ⑤ Follow → Notify followed user
     */
    async onUserFollowed(followerId: string, followedUserId: string) {
        if (followerId === followedUserId) return;

        const sender = await this.repository.getUserById(followerId);
        if (!sender) return;

        // Deduplication
        const duplicate = await this.repository.findDuplicateNotification(
            followerId,
            followedUserId,
            followerId,
            "FOLLOW",
            60 // 60 min window for follow notifications
        );
        if (duplicate) return;

        const notification = await this.repository.createNotification({
            recipientId: followedUserId,
            actorId: followerId,
            entityType: "FOLLOW",
            entityId: followerId,
            message: `${sender.name} started following you`,
            type: "FOLLOW",
            metaData: {
                actionUrl: `/${sender.username}`,
                image: sender.avatarUrl || undefined,
            },
        });

        if (!notification) return;

        await this.emitRealTimeNotification(followedUserId, {
            id: notification.id,
            type: "FOLLOW",
            sender: {
                id: sender.id,
                username: sender.username,
                name: sender.name,
                avatarUrl: sender.avatarUrl || undefined,
            },
            message: notification.message,
            createdAt: notification.createdAt.toISOString(),
        });

        await this.enqueuePushNotification(followedUserId, notification);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LEGACY: Template-based event handling (for Kafka ingestion compat)
    // ─────────────────────────────────────────────────────────────────────────

    async handleEvent(event: SendNotificationInput) {
        const {
            recipientId,
            actorId,
            templateSlug,
            entityType,
            entityId,
            data,
        } = event;

        const template = await this.repository.getTemplateBySlug(templateSlug);
        if (!template) throw new Error(`Template not found: ${templateSlug}`);

        // Redis-based Deduplication
        const dedupeKey = `notif:dedupe:${recipientId}:${template.id}:${entityId}`;
        const isDuplicate = await redis.get(dedupeKey);

        if (isDuplicate) {
            const existing =
                await this.repository.findAggregatableNotification(
                    recipientId,
                    entityId,
                    entityType
                );
            if (existing) {
                const newCount = (existing.metaData?.count || 1) + 1;
                const message = this.hydrateTemplate(template.bodyTemplate, {
                    ...data,
                    count: newCount,
                });

                await this.repository.updateNotification(existing.id, {
                    message,
                    metaData: {
                        ...existing.metaData,
                        count: newCount,
                        lastActorId: actorId ?? undefined,
                    },
                });

                await this.emitLegacyEvent(recipientId, {
                    id: existing.id,
                    message,
                    count: newCount,
                });
                return;
            }
        }

        const message = this.hydrateTemplate(template.bodyTemplate, {
            ...data,
            count: 1,
        });
        const notification = await this.repository.createNotification({
            recipientId,
            actorId: actorId ?? undefined,
            templateId: template.id,
            entityType,
            entityId,
            message,
            metaData: { ...event.metaData, count: 1 },
        });

        if (!notification) throw new Error("Failed to create notification");

        await redis.set(dedupeKey, "1", "EX", 300);

        const channels = await this.resolveEnabledChannels(
            recipientId,
            template.id
        );

        for (const channel of channels) {
            await this.enqueueDelivery(channel, {
                notificationId: notification.id,
                recipientId,
                title: this.hydrateTemplate(template.titleTemplate, data),
                message,
                metaData: notification.metaData,
            });
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // USER-FACING API METHODS
    // ─────────────────────────────────────────────────────────────────────────

    async getNotifications(
        userId: string,
        limit: number,
        cursor?: string,
        type?: string
    ) {
        return this.repository.getNotifications(userId, limit, cursor, type);
    }

    async getUnreadCount(userId: string) {
        return this.repository.getUnreadCount(userId);
    }

    async registerDevice(userId: string, input: RegisterDeviceInput) {
        return this.repository.registerDevice(userId, input);
    }

    async markRead(id: string, userId: string) {
        return this.repository.markAsRead(id, userId);
    }

    async markAllRead(userId: string) {
        return this.repository.markAllAsRead(userId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INTERNAL HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Emit real-time notification via Redis Pub/Sub → WebSocket Gateway
     */
    private async emitRealTimeNotification(
        userId: string,
        payload: NotificationWSPayload
    ) {
        try {
            await redis.publish(
                "events:notifications",
                JSON.stringify({
                    recipientId: userId,
                    ...payload,
                })
            );
        } catch (err) {
            console.error("Failed to publish real-time notification:", err);
        }
    }

    /**
     * Legacy event emit for backward compatibility
     */
    private async emitLegacyEvent(userId: string, data: any) {
        await redis.publish(
            "events:notifications",
            JSON.stringify({ userId, ...data })
        );
    }

    /**
     * Enqueue push notification via RabbitMQ for async delivery
     */
    private async enqueuePushNotification(userId: string, notification: any) {
        try {
            const rabbitChannel = await getRabbitChannel();
            rabbitChannel.sendToQueue(
                "notification_delivery_push",
                Buffer.from(
                    JSON.stringify({
                        notificationId: notification.id,
                        recipientId: userId,
                        title: "New Notification",
                        message: notification.message,
                        metaData: notification.metaData,
                    })
                ),
                { persistent: true }
            );
        } catch (err) {
            // RabbitMQ may not be available in development — fail gracefully
            console.warn("Push notification enqueue skipped (RabbitMQ unavailable):", (err as Error).message);
        }
    }

    private hydrateTemplate(template: string, data: any = {}): string {
        return template.replace(
            /\{\{(.*?)\}\}/g,
            (_, key) => data[key.trim()] || ""
        );
    }

    private async resolveEnabledChannels(
        userId: string,
        templateId: string
    ): Promise<string[]> {
        const enabled: string[] = [];
        const settings = await this.repository.getUserSettings(userId);

        if (this.isQuietHours(settings)) {
            return ["IN_APP"];
        }

        const channels: ("PUSH" | "EMAIL" | "IN_APP")[] = [
            "PUSH",
            "EMAIL",
            "IN_APP",
        ];
        for (const channel of channels) {
            const isEnabled = await this.repository.isChannelEnabled(
                userId,
                templateId,
                channel
            );
            if (isEnabled) enabled.push(channel);
        }

        return enabled;
    }

    private isQuietHours(settings: any): boolean {
        if (!settings.quietHoursStart || !settings.quietHoursEnd) return false;

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const [startH, startM] = settings.quietHoursStart.split(":").map(Number);
        const [endH, endM] = settings.quietHoursEnd.split(":").map(Number);

        const startTime = startH * 60 + startM;
        const endTime = endH * 60 + endM;

        if (startTime < endTime) {
            return currentTime >= startTime && currentTime <= endTime;
        } else {
            return currentTime >= startTime || currentTime <= endTime;
        }
    }

    private async enqueueDelivery(channel: string, payload: any) {
        try {
            const rabbitChannel = await getRabbitChannel();
            const queueName = `notification_delivery_${channel.toLowerCase()}`;
            await rabbitChannel.assertQueue(queueName, { durable: true });
            rabbitChannel.sendToQueue(
                queueName,
                Buffer.from(JSON.stringify(payload)),
                { persistent: true }
            );
        } catch (err) {
            console.warn(
                `Failed to enqueue ${channel} delivery:`,
                (err as Error).message
            );
        }
    }
}
