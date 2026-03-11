/**
 * Admin Service — Business Logic for Admin Operations
 * 
 * Includes:
 * - Post management with override capabilities
 * - User management (suspend, unsuspend, role assignment)  
 * - Dashboard analytics
 * - Anti-privilege-escalation enforcement
 */

import { AdminRepository } from "./admin.repository.js";
import { PostRepository } from "../post/post.repository.js";
import { AuditService } from "../audit/audit.service.js";
import { hasMinimumRole, type UserRole } from "../../middleware/rbac.js";
import * as events from "../moderation/moderation.events.js";
import { AppError } from "../../utils/AppError.js";
import { db } from "../../config/drizzle.js";
import { users, sessions } from "../../db/schema.js";
import { eq } from "drizzle-orm";

const postRepo = new PostRepository();
const auditService = new AuditService();

export class AdminService {
    private repository = new AdminRepository();

    // ─── Post Management ─────────────────────────────────

    async listPosts(filters: any) {
        return await this.repository.findManagedPosts(filters);
    }

    async getPostDetail(id: string) {
        return await postRepo.findByIdHydrated(id);
    }

    async getNextPost(currentId: string, filters: any) {
        return await this.repository.getNextInQueue(currentId, filters);
    }

    async moderate(data: {
        postId: string;
        action: any;
        adminId: string;
        reason: string;
        internalNote?: string | undefined;
    }) {
        return await this.repository.moderatePost(data);
    }

    async addNote(postId: string, adminId: string, content: string) {
        return await this.repository.addModeratorNote(postId, adminId, content);
    }

    async getReports(postId: string) {
        return await this.repository.getPostReports(postId);
    }

    async getHistory(limit: number = 50, cursor?: string) {
        return await this.repository.findManagedPosts({ limit, offset: 0 });
    }

    async bulkPostAction(
        postIds: string[],
        action: "APPROVE" | "DELETE" | "RESTORE",
        adminId: string,
        reason: string
    ) {
        return await this.repository.bulkAction(postIds, action, adminId, reason);
    }

    async getDashboardStats(timeRangeHours?: number) {
        return await this.repository.getDashboardStats(timeRangeHours);
    }

    // ─── User Management ─────────────────────────────────

    /**
     * Suspend a user. Sets status to SUSPENDED.
     * Emits UserSuspended event for downstream services to invalidate sessions, etc.
     */
    async suspendUser(userId: string, adminId: string, reason: string) {
        // Verify target user exists and is not already suspended
        const [targetUser] = await db.select({ status: users.status, role: users.role })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!targetUser) {
            throw new AppError("User not found", 404);
        }

        if (targetUser.status === "SUSPENDED") {
            throw new AppError("User is already suspended", 400);
        }

        // Anti-privilege-escalation: cannot suspend an ADMIN or higher
        if (targetUser.role === "ADMIN" || targetUser.role === "SUPER_ADMIN") {
            throw new AppError("Cannot suspend an admin. Contact SUPER_ADMIN.", 403);
        }

        const [updated] = await db.update(users)
            .set({ status: "SUSPENDED", updatedAt: new Date() })
            .where(eq(users.id, userId))
            .returning();

        // Audit log
        await auditService.logFromRequest(adminId, "USER_SUSPEND", "USER", userId, {
            reason,
            previousState: { status: targetUser.status },
            newState: { status: "SUSPENDED" },
        });

        // Emit event (for session invalidation, notifications, etc.)
        events.emitUserSuspended(userId, adminId, reason);

        return { success: true, userId, newStatus: "SUSPENDED" };
    }

    /**
     * Unsuspend (reactivate) a user.
     */
    async unsuspendUser(userId: string, adminId: string, reason: string) {
        const [targetUser] = await db.select({ status: users.status })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!targetUser) {
            throw new AppError("User not found", 404);
        }

        if (targetUser.status !== "SUSPENDED") {
            throw new AppError("User is not suspended", 400);
        }

        const [updated] = await db.update(users)
            .set({ status: "ACTIVE", updatedAt: new Date() })
            .where(eq(users.id, userId))
            .returning();

        await auditService.logFromRequest(adminId, "USER_UNSUSPEND", "USER", userId, {
            reason,
            previousState: { status: "SUSPENDED" },
            newState: { status: "ACTIVE" },
        });

        return { success: true, userId, newStatus: "ACTIVE" };
    }

    /**
     * Assign a role to a user.
     * Anti-privilege-escalation: cannot assign a role >= your own.
     */
    async assignRole(userId: string, newRole: string, adminId: string, reason: string) {
        // Fetch both actor and target
        const [targetUser] = await db.select({ role: users.role })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        const [adminUser] = await db.select({ role: users.role })
            .from(users)
            .where(eq(users.id, adminId))
            .limit(1);

        if (!targetUser) {
            throw new AppError("Target user not found", 404);
        }

        if (!adminUser) {
            throw new AppError("Admin user not found", 404);
        }

        // Anti-privilege-escalation: admin cannot assign ADMIN or higher
        // Only SUPER_ADMIN can promote to ADMIN
        if (newRole === "SUPER_ADMIN") {
            throw new AppError("Cannot assign SUPER_ADMIN role through the API", 403);
        }

        if (newRole === "ADMIN" && adminUser.role !== "SUPER_ADMIN") {
            throw new AppError("Only SUPER_ADMIN can assign ADMIN role", 403);
        }

        // Cannot change own role
        if (userId === adminId) {
            throw new AppError("Cannot change your own role", 400);
        }

        const oldRole = targetUser.role;

        const [updated] = await db.update(users)
            .set({ role: newRole as any, updatedAt: new Date() })
            .where(eq(users.id, userId))
            .returning();

        // Audit log
        await auditService.logFromRequest(adminId, "ROLE_CHANGE", "USER", userId, {
            reason,
            previousState: { role: oldRole },
            newState: { role: newRole },
        });

        // Emit event
        events.emitUserRoleChanged(userId, adminId, oldRole, newRole, reason);

        return { success: true, userId, oldRole, newRole };
    }

    /**
     * Ban a user account. Sets status to DELETED and revokes all active sessions.
     * This is intended to be a hard block – the user cannot log in again unless
     * an administrator manually restores their account in the database.
     */
    async banUser(userId: string, adminId: string, reason: string) {
        const [targetUser] = await db
            .select({ status: users.status })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!targetUser) {
            throw new AppError("User not found", 404);
        }

        if (targetUser.status === "DELETED") {
            throw new AppError("User is already banned", 400);
        }

        await db.transaction(async (tx) => {
            await tx
                .update(users)
                .set({ status: "DELETED", updatedAt: new Date() })
                .where(eq(users.id, userId));

            await tx
                .update(sessions)
                .set({ isValid: false })
                .where(eq(sessions.userId, userId));

            await auditService.logFromRequest(adminId, "USER_BAN", "USER", userId, {
                reason,
                previousState: { status: targetUser.status },
                newState: { status: "DELETED" },
            });
        });

        return { success: true, userId, newStatus: "DELETED" as const };
    }

    async getActivityLogs(userId: string, limit: number = 50) {
        return await this.repository.getUserAuditLogs(userId, limit);
    }
}
