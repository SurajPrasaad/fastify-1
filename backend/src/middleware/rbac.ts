/**
 * RBAC Middleware — Production-Grade Role-Based Access Control
 * 
 * Designed to evolve from role-based → permission-based:
 *   - Current: Role enum checks
 *   - Future: Permission bitmask / policy engine
 * 
 * Middleware chain: Rate Limit → Auth (JWT) → RBAC → Handler
 */

import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../utils/AppError.js";

// ─── Role Hierarchy ───────────────────────────────────────
// ADMIN > MODERATOR > USER
// Higher role inherits all lower role permissions

export type UserRole = "USER" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN";

const ROLE_HIERARCHY: Record<UserRole, number> = {
    USER: 0,
    MODERATOR: 1,
    ADMIN: 2,
    SUPER_ADMIN: 3,
};

// ─── Permission Definitions ──────────────────────────────
// Future-ready: These can be stored in DB and assigned per-role

export const PERMISSIONS = {
    // Post permissions
    POST_CREATE: "post:create",
    POST_EDIT_OWN: "post:edit_own",
    POST_DELETE_OWN: "post:delete_own",
    POST_VIEW_STATUS: "post:view_status",

    // Moderation permissions
    MOD_ACCESS_QUEUE: "mod:access_queue",
    MOD_APPROVE: "mod:approve",
    MOD_REJECT: "mod:reject",
    MOD_REQUEST_EDIT: "mod:request_edit",
    MOD_ADD_NOTES: "mod:add_notes",
    MOD_ESCALATE: "mod:escalate",

    // Admin permissions
    ADMIN_OVERRIDE: "admin:override",
    ADMIN_SUSPEND_USER: "admin:suspend_user",
    ADMIN_ASSIGN_ROLES: "admin:assign_roles",
    ADMIN_VIEW_AUDIT: "admin:view_audit",
    ADMIN_CONFIGURE: "admin:configure",
    ADMIN_VIEW_ANALYTICS: "admin:view_analytics",
} as const;

type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// ─── Role → Permission Mapping ───────────────────────────
const ROLE_PERMISSIONS: Record<UserRole, Set<Permission>> = {
    USER: new Set([
        PERMISSIONS.POST_CREATE,
        PERMISSIONS.POST_EDIT_OWN,
        PERMISSIONS.POST_DELETE_OWN,
        PERMISSIONS.POST_VIEW_STATUS,
    ]),
    MODERATOR: new Set([
        // Inherits USER permissions
        PERMISSIONS.POST_CREATE,
        PERMISSIONS.POST_EDIT_OWN,
        PERMISSIONS.POST_DELETE_OWN,
        PERMISSIONS.POST_VIEW_STATUS,
        // Moderator-specific
        PERMISSIONS.MOD_ACCESS_QUEUE,
        PERMISSIONS.MOD_APPROVE,
        PERMISSIONS.MOD_REJECT,
        PERMISSIONS.MOD_REQUEST_EDIT,
        PERMISSIONS.MOD_ADD_NOTES,
        PERMISSIONS.MOD_ESCALATE,
    ]),
    ADMIN: new Set([
        // Inherits ALL permissions
        PERMISSIONS.POST_CREATE,
        PERMISSIONS.POST_EDIT_OWN,
        PERMISSIONS.POST_DELETE_OWN,
        PERMISSIONS.POST_VIEW_STATUS,
        PERMISSIONS.MOD_ACCESS_QUEUE,
        PERMISSIONS.MOD_APPROVE,
        PERMISSIONS.MOD_REJECT,
        PERMISSIONS.MOD_REQUEST_EDIT,
        PERMISSIONS.MOD_ADD_NOTES,
        PERMISSIONS.MOD_ESCALATE,
        PERMISSIONS.ADMIN_OVERRIDE,
        PERMISSIONS.ADMIN_SUSPEND_USER,
        PERMISSIONS.ADMIN_ASSIGN_ROLES,
        PERMISSIONS.ADMIN_VIEW_AUDIT,
        PERMISSIONS.ADMIN_CONFIGURE,
        PERMISSIONS.ADMIN_VIEW_ANALYTICS,
    ]),
    SUPER_ADMIN: new Set([
        // All permissions (identical to ADMIN for now)
        ...Object.values(PERMISSIONS),
    ]),
};

// ─── Helper: Get user's role from request ────────────────

function getUserRole(request: FastifyRequest): UserRole {
    const user = (request as unknown as { user?: { role?: string } }).user;
    if (!user?.role) return "USER";
    const role = user.role as UserRole;
    if (!(role in ROLE_HIERARCHY)) return "USER";
    return role;
}

// ─── Middleware Factory: Require Minimum Role ────────────

export function requireRole(...allowedRoles: UserRole[]) {
    return async function roleGuard(
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<void> {
        const userRole = getUserRole(request);

        // Check if user's role is in allowed list
        const hasRole = allowedRoles.some(
            (allowed) => ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[allowed]
        );

        if (!hasRole) {
            throw new AppError(
                `Forbidden: Requires one of [${allowedRoles.join(", ")}] role`,
                403
            );
        }
    };
}

// ─── Middleware Factory: Require Specific Permission ─────

export function requirePermission(...permissions: Permission[]) {
    return async function permissionGuard(
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<void> {
        const userRole = getUserRole(request);
        const rolePerms = ROLE_PERMISSIONS[userRole];

        const hasAllPermissions = permissions.every((p) => rolePerms.has(p));

        if (!hasAllPermissions) {
            const missing = permissions.filter((p) => !rolePerms.has(p));
            throw new AppError(
                `Forbidden: Missing permissions [${missing.join(", ")}]`,
                403
            );
        }
    };
}

// ─── Convenience Middleware: Common Guards ────────────────

export const requireModerator = requireRole("MODERATOR");
export const requireAdmin = requireRole("ADMIN");
export const requireSuperAdmin = requireRole("SUPER_ADMIN");

// ─── Utility: Check permission programmatically ──────────

export function hasPermission(role: UserRole, permission: Permission): boolean {
    const rolePerms = ROLE_PERMISSIONS[role];
    return rolePerms.has(permission);
}

export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

// ─── Anti-Privilege-Escalation Guard ─────────────────────
// Prevents a MODERATOR from assigning ADMIN role, etc.

export function requireHigherRole(targetRole: UserRole) {
    return async function antiEscalationGuard(
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<void> {
        const actorRole = getUserRole(request);

        if (ROLE_HIERARCHY[actorRole] <= ROLE_HIERARCHY[targetRole]) {
            throw new AppError(
                "Forbidden: Cannot assign a role equal to or higher than your own",
                403
            );
        }
    };
}
