/**
 * Notification Trigger Integration
 *
 * This module provides helper functions to fire notification triggers
 * from existing service modules (interaction, comment, follow).
 *
 * Usage Pattern:
 * Instead of importing NotificationService directly into every module,
 * import these lightweight trigger functions.
 *
 * Example:
 *   import { triggerLikeNotification } from "../notification/notification.triggers.js";
 *   await triggerLikeNotification(userId, postOwnerId, postId);
 */

import { NotificationService } from "./notification.service.js";
import { NotificationRepository } from "./notification.repository.js";

// Singleton instance shared across all trigger calls
const repo = new NotificationRepository();
const notificationService = new NotificationService(repo);

/**
 * Fire-and-forget wrapper to prevent notification failures
 * from breaking the main business logic flow
 */
function fireAndForget(fn: () => Promise<void>, label: string) {
    fn().catch((err) => {
        console.error(`[NotificationTrigger] ${label} failed:`, err);
    });
}

// ─── Trigger Functions ────────────────────────────────────────────────────────

/**
 * When a user likes a post → notify post owner
 */
export function triggerLikeNotification(
    senderId: string,
    postOwnerId: string,
    postId: string,
    postContent?: string
) {
    fireAndForget(
        () => notificationService.onPostLiked(senderId, postOwnerId, postId, postContent),
        "LIKE"
    );
}

/**
 * When a user reposts a post → notify post owner
 */
export function triggerRepostNotification(
    senderId: string,
    postOwnerId: string,
    postId: string,
    postContent?: string,
    postMedia?: string[]
) {
    fireAndForget(
        () => notificationService.onPostReposted(senderId, postOwnerId, postId, postContent, postMedia),
        "REPOST"
    );
}

/**
 * When a user likes a comment → notify comment owner
 */
export function triggerCommentLikeNotification(
    senderId: string,
    commentOwnerId: string,
    commentId: string,
    postId: string,
    commentContent?: string
) {
    fireAndForget(
        () => notificationService.onCommentLiked(senderId, commentOwnerId, commentId, postId, commentContent),
        "LIKE_COMMENT"
    );
}

/**
 * When a user creates a comment → notify post owner
 */
export function triggerCommentNotification(
    senderId: string,
    postOwnerId: string,
    postId: string,
    commentId: string,
    commentContent: string
) {
    fireAndForget(
        () =>
            notificationService.onCommentCreated(
                senderId,
                postOwnerId,
                postId,
                commentId,
                commentContent
            ),
        "COMMENT"
    );
}

/**
 * When a user replies to a comment → notify parent comment owner
 */
export function triggerReplyNotification(
    senderId: string,
    parentCommentOwnerId: string,
    postId: string,
    replyCommentId: string,
    parentCommentId: string,
    replyContent: string
) {
    fireAndForget(
        () =>
            notificationService.onReplyCreated(
                senderId,
                parentCommentOwnerId,
                postId,
                replyCommentId,
                parentCommentId,
                replyContent
            ),
        "REPLY"
    );
}

/**
 * When a user follows another user → notify followed user
 */
export function triggerFollowNotification(
    followerId: string,
    followedUserId: string
) {
    fireAndForget(
        () => notificationService.onUserFollowed(followerId, followedUserId),
        "FOLLOW"
    );
}

/**
 * Parse and trigger mention notifications for any text content
 */
export function triggerMentionNotifications(
    senderId: string,
    text: string,
    postId: string,
    commentId?: string
) {
    fireAndForget(
        () =>
            notificationService.onMentionsInText(
                senderId,
                text,
                postId,
                commentId
            ),
        "MENTION"
    );
}
