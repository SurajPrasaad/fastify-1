/**
 * Moderation Event Producer — Kafka Event-Driven Architecture
 * 
 * Emits events for the entire post lifecycle:
 * PostCreated → PostSubmittedForReview → PostApproved/Rejected → PostPublished
 * 
 * Consumers: Notification Service, Audit Service, Feed Service, Analytics
 */

import { producer } from "../../config/kafka.js";

// ─── Event Types ─────────────────────────────────────────

export const MODERATION_TOPICS = {
    POST_CREATED: "post.created",
    POST_SUBMITTED_FOR_REVIEW: "post.submitted_for_review",
    POST_APPROVED: "post.approved",
    POST_REJECTED: "post.rejected",
    POST_PUBLISHED: "post.published",
    POST_REMOVED: "post.removed",
    POST_RESTORED: "post.restored",
    POST_REVISION_REQUESTED: "post.revision_requested",
    POST_ESCALATED: "post.escalated",
    USER_SUSPENDED: "user.suspended",
    USER_ROLE_CHANGED: "user.role_changed",
    MODERATION_ACTION: "moderation.action",
} as const;

export type ModerationTopic = typeof MODERATION_TOPICS[keyof typeof MODERATION_TOPICS];

// ─── Event Payload Types ─────────────────────────────────

export interface PostEvent {
    eventId: string;
    timestamp: string;
    postId: string;
    userId: string;
    status: string;
    metadata?: Record<string, unknown>;
}

export interface ModerationActionEvent {
    eventId: string;
    timestamp: string;
    postId: string;
    moderatorId: string;
    action: string;
    reason: string;
    previousStatus: string;
    newStatus: string;
    riskScore?: number;
    metadata?: Record<string, unknown>;
}

export interface UserEvent {
    eventId: string;
    timestamp: string;
    userId: string;
    actorId: string;
    action: string;
    reason: string;
    metadata?: Record<string, unknown>;
}

// ─── Event Producer ──────────────────────────────────────

function generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

async function emitEvent(topic: ModerationTopic, payload: Record<string, unknown>): Promise<void> {
    try {
        await producer.send({
            topic,
            messages: [
                {
                    key: (payload.postId || payload.userId || "system") as string,
                    value: JSON.stringify({
                        ...payload,
                        eventId: payload.eventId || generateEventId(),
                        timestamp: payload.timestamp || new Date().toISOString(),
                    }),
                    headers: {
                        "event-type": topic,
                        "event-version": "1.0",
                        "correlation-id": generateEventId(),
                    },
                },
            ],
        });
    } catch (err) {
        // Log but don't throw — events are best-effort in most cases
        console.error(`[KAFKA] Failed to emit ${topic}:`, err);

        // In production, push to a dead letter queue or retry mechanism
        // For now, log and continue
    }
}

// ─── Specific Event Emitters ─────────────────────────────

export async function emitPostCreated(postId: string, userId: string, metadata?: Record<string, unknown>): Promise<void> {
    await emitEvent(MODERATION_TOPICS.POST_CREATED, {
        postId,
        userId,
        status: "PENDING_REVIEW",
        metadata,
    });
}

export async function emitPostSubmittedForReview(postId: string, userId: string): Promise<void> {
    await emitEvent(MODERATION_TOPICS.POST_SUBMITTED_FOR_REVIEW, {
        postId,
        userId,
        status: "PENDING_REVIEW",
    });
}

export async function emitPostApproved(
    postId: string,
    moderatorId: string,
    reason: string,
    previousStatus: string
): Promise<void> {
    await emitEvent(MODERATION_TOPICS.POST_APPROVED, {
        postId,
        moderatorId,
        action: "APPROVE",
        reason,
        previousStatus,
        newStatus: "APPROVED",
    });
}

export async function emitPostRejected(
    postId: string,
    moderatorId: string,
    reason: string
): Promise<void> {
    await emitEvent(MODERATION_TOPICS.POST_REJECTED, {
        postId,
        moderatorId,
        action: "REJECT",
        reason,
        previousStatus: "PENDING_REVIEW",
        newStatus: "REJECTED",
    });
}

export async function emitPostPublished(postId: string, userId: string): Promise<void> {
    await emitEvent(MODERATION_TOPICS.POST_PUBLISHED, {
        postId,
        userId,
        status: "PUBLISHED",
    });
}

export async function emitPostRemoved(
    postId: string,
    moderatorId: string,
    reason: string
): Promise<void> {
    await emitEvent(MODERATION_TOPICS.POST_REMOVED, {
        postId,
        moderatorId,
        action: "REMOVE",
        reason,
        previousStatus: "PUBLISHED",
        newStatus: "REMOVED",
    });
}

export async function emitPostRestored(
    postId: string,
    adminId: string,
    reason: string
): Promise<void> {
    await emitEvent(MODERATION_TOPICS.POST_RESTORED, {
        postId,
        adminId,
        action: "RESTORE",
        reason,
        newStatus: "PUBLISHED",
    });
}

export async function emitRevisionRequested(
    postId: string,
    moderatorId: string,
    reason: string
): Promise<void> {
    await emitEvent(MODERATION_TOPICS.POST_REVISION_REQUESTED, {
        postId,
        moderatorId,
        action: "REQUEST_REVISION",
        reason,
        previousStatus: "PENDING_REVIEW",
        newStatus: "NEEDS_REVISION",
    });
}

export async function emitPostEscalated(
    postId: string,
    moderatorId: string,
    reason: string
): Promise<void> {
    await emitEvent(MODERATION_TOPICS.POST_ESCALATED, {
        postId,
        moderatorId,
        action: "ESCALATE",
        reason,
    });
}

export async function emitUserSuspended(
    userId: string,
    adminId: string,
    reason: string
): Promise<void> {
    await emitEvent(MODERATION_TOPICS.USER_SUSPENDED, {
        userId,
        actorId: adminId,
        action: "SUSPEND",
        reason,
    });
}

export async function emitUserRoleChanged(
    userId: string,
    adminId: string,
    oldRole: string,
    newRole: string,
    reason: string
): Promise<void> {
    await emitEvent(MODERATION_TOPICS.USER_ROLE_CHANGED, {
        userId,
        actorId: adminId,
        action: "ROLE_CHANGE",
        reason,
        metadata: { oldRole, newRole },
    });
}

export async function emitModerationAction(data: ModerationActionEvent): Promise<void> {
    await emitEvent(MODERATION_TOPICS.MODERATION_ACTION, data as any);
}
