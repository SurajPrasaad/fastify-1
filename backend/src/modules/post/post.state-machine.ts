/**
 * Post State Machine — Enforces valid state transitions
 * 
 * Implements the strict post lifecycle:
 * DRAFT → PENDING_REVIEW → APPROVED → PUBLISHED
 *                        → REJECTED → (resubmit) → PENDING_REVIEW
 *                        → NEEDS_REVISION → (edit & resubmit) → PENDING_REVIEW
 * PUBLISHED → REMOVED (by mod/admin)
 * PUBLISHED → ARCHIVED (by user)
 * REMOVED → PUBLISHED (admin override only)
 * ARCHIVED → PUBLISHED (user un-archive)
 */

import type { UserRole } from "../../middleware/rbac.js";

export type PostStatus =
    | "DRAFT"
    | "PENDING_REVIEW"
    | "APPROVED"
    | "PUBLISHED"
    | "REJECTED"
    | "NEEDS_REVISION"
    | "REMOVED"
    | "ARCHIVED";

export type ModerationAction =
    | "SUBMIT"           // User submits for review
    | "APPROVE"          // Moderator approves
    | "REJECT"           // Moderator rejects
    | "REQUEST_REVISION" // Moderator requests changes
    | "PUBLISH"          // System publishes (after approval)
    | "REMOVE"           // Moderator/Admin removes
    | "RESTORE"          // Admin restores removed post
    | "ARCHIVE"          // User archives
    | "UNARCHIVE"        // User un-archives
    | "RESUBMIT"         // User resubmits after revision/rejection
    | "FLAG"             // Moderator manually flags
    | "ESCALATE";        // Moderator escalates to admin

// ─── Transition Definition ───────────────────────────────

interface Transition {
    from: PostStatus;
    to: PostStatus;
    action: ModerationAction;
    allowedRoles: UserRole[];
    requiresOwnership?: boolean;  // true = actor must own the post
}

const TRANSITIONS: Transition[] = [
    // User actions
    { from: "DRAFT", to: "PENDING_REVIEW", action: "SUBMIT", allowedRoles: ["USER", "MODERATOR", "ADMIN", "SUPER_ADMIN"], requiresOwnership: true },
    { from: "NEEDS_REVISION", to: "PENDING_REVIEW", action: "RESUBMIT", allowedRoles: ["USER", "MODERATOR", "ADMIN", "SUPER_ADMIN"], requiresOwnership: true },
    { from: "REJECTED", to: "PENDING_REVIEW", action: "RESUBMIT", allowedRoles: ["USER", "MODERATOR", "ADMIN", "SUPER_ADMIN"], requiresOwnership: true },
    { from: "PUBLISHED", to: "ARCHIVED", action: "ARCHIVE", allowedRoles: ["USER", "MODERATOR", "ADMIN", "SUPER_ADMIN"], requiresOwnership: true },
    { from: "ARCHIVED", to: "PUBLISHED", action: "UNARCHIVE", allowedRoles: ["USER", "MODERATOR", "ADMIN", "SUPER_ADMIN"], requiresOwnership: true },

    // Moderator actions
    { from: "PENDING_REVIEW", to: "APPROVED", action: "APPROVE", allowedRoles: ["MODERATOR", "ADMIN", "SUPER_ADMIN"] },
    { from: "PENDING_REVIEW", to: "REJECTED", action: "REJECT", allowedRoles: ["MODERATOR", "ADMIN", "SUPER_ADMIN"] },
    { from: "PENDING_REVIEW", to: "NEEDS_REVISION", action: "REQUEST_REVISION", allowedRoles: ["MODERATOR", "ADMIN", "SUPER_ADMIN"] },
    { from: "PENDING_REVIEW", to: "PENDING_REVIEW", action: "ESCALATE", allowedRoles: ["MODERATOR", "ADMIN", "SUPER_ADMIN"] },
    { from: "PENDING_REVIEW", to: "PENDING_REVIEW", action: "FLAG", allowedRoles: ["MODERATOR", "ADMIN", "SUPER_ADMIN"] },
    { from: "PUBLISHED", to: "REMOVED", action: "REMOVE", allowedRoles: ["MODERATOR", "ADMIN", "SUPER_ADMIN"] },

    // System actions
    { from: "APPROVED", to: "PUBLISHED", action: "PUBLISH", allowedRoles: ["ADMIN", "SUPER_ADMIN", "MODERATOR"] },

    // Admin-only actions (overrides)
    { from: "REMOVED", to: "PUBLISHED", action: "RESTORE", allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
    { from: "REJECTED", to: "PUBLISHED", action: "RESTORE", allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
];

// ─── State Machine Validator ─────────────────────────────

export interface TransitionResult {
    valid: boolean;
    newStatus?: PostStatus;
    error?: string;
}

export function validateTransition(
    currentStatus: PostStatus,
    action: ModerationAction,
    actorRole: UserRole,
    isOwner: boolean
): TransitionResult {
    // Find matching transition
    const transition = TRANSITIONS.find(
        (t) => t.from === currentStatus && t.action === action
    );

    if (!transition) {
        return {
            valid: false,
            error: `Invalid transition: Cannot perform '${action}' on post with status '${currentStatus}'`,
        };
    }

    // Check role authorization
    const roleHierarchy: Record<UserRole, number> = {
        USER: 0,
        MODERATOR: 1,
        ADMIN: 2,
        SUPER_ADMIN: 3,
    };

    const isRoleAllowed = transition.allowedRoles.some(
        (allowed) => roleHierarchy[actorRole] >= roleHierarchy[allowed]
    );

    if (!isRoleAllowed) {
        return {
            valid: false,
            error: `Forbidden: Role '${actorRole}' cannot perform '${action}' on this post`,
        };
    }

    // Check ownership requirement
    if (transition.requiresOwnership && !isOwner) {
        return {
            valid: false,
            error: `Forbidden: Only the post owner can perform '${action}'`,
        };
    }

    return {
        valid: true,
        newStatus: transition.to,
    };
}

// ─── Helper: Get available actions for a post ────────────

export function getAvailableActions(
    currentStatus: PostStatus,
    actorRole: UserRole,
    isOwner: boolean
): ModerationAction[] {
    const roleHierarchy: Record<UserRole, number> = {
        USER: 0,
        MODERATOR: 1,
        ADMIN: 2,
        SUPER_ADMIN: 3,
    };

    return TRANSITIONS
        .filter((t) => t.from === currentStatus)
        .filter((t) => {
            const isRoleAllowed = t.allowedRoles.some(
                (allowed) => roleHierarchy[actorRole] >= roleHierarchy[allowed]
            );
            if (!isRoleAllowed) return false;
            if (t.requiresOwnership && !isOwner) return false;
            return true;
        })
        .map((t) => t.action);
}

// ─── Helper: Check if status is publicly visible ─────────

export function isPubliclyVisible(status: PostStatus): boolean {
    return status === "PUBLISHED";
}

// ─── Helper: Check if post is editable ───────────────────

export function isEditable(status: PostStatus): boolean {
    return ["DRAFT", "NEEDS_REVISION", "REJECTED"].includes(status);
}
