
import { consumer } from "../../config/kafka.js";
import { NotificationService } from "./notification.service.js";
import { NotificationRepository } from "./notification.repository.js";
import type { SendNotificationInput } from "./notification.dto.js";

const repo = new NotificationRepository();
const service = new NotificationService(repo);

/**
 * Enterprise Event Ingestion
 * Listens to core domain events and maps them to notifications
 */
export async function startKafkaIngestion() {
    await consumer.subscribe({
        topics: ['post.liked', 'comment.created', 'user.followed', 'message.received'],
        fromBeginning: false
    });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            try {
                if (!message.value) return;
                const payload = JSON.parse(message.value.toString());

                // Idempotency check: Use Kafka offset + topic as a temporary lock in Redis
                // to prevent double processing of the same exact Kafka message

                const event = mapTopicToNotification(topic, payload);
                if (event) {
                    await service.handleEvent(event);
                }
            } catch (error) {
                console.error(`❌ Kafka Processing Error [${topic}]:`, error);
                // In a production system, we'd send this to a dedicated Kafka Retry Topic
            }
        },
    });
}

function mapTopicToNotification(topic: string, payload: any): SendNotificationInput | null {
    switch (topic) {
        case 'post.liked':
            return {
                recipientId: payload.postOwnerId,
                actorId: payload.userId,
                templateSlug: 'post_liked',
                entityType: 'POST',
                entityId: payload.postId,
                data: { actorName: payload.userName },
            };
        case 'comment.created':
            return {
                recipientId: payload.postOwnerId,
                actorId: payload.userId,
                templateSlug: 'new_comment',
                entityType: 'COMMENT',
                entityId: payload.commentId,
                data: { actorName: payload.userName },
            };
        case 'user.followed':
            return {
                recipientId: payload.targetUserId,
                actorId: payload.followerId,
                templateSlug: 'new_follower',
                entityType: 'FOLLOW',
                entityId: payload.followerId,
                data: { actorName: payload.followerName },
            };
        case 'message.received':
            return {
                recipientId: payload.recipientId,
                actorId: payload.senderId,
                templateSlug: 'new_message',
                entityType: 'CHAT',
                entityId: payload.chatRoomId,
                data: { actorName: payload.senderName, snippet: payload.content.substring(0, 30) },
            };
        default:
            return null;
    }
}
