/**
 * Audit Repository — Data Access for Audit Logs
 * 
 * Writes to the enhanced admin_audit_logs table.
 * Supports structured queries for admin dashboard.
 */

import { db } from "../../config/drizzle.js";
import { adminAuditLogsExtended, users } from "../../db/schema.js";
import { and, desc, eq, gte, lte, sql, count, ilike } from "drizzle-orm";

export interface AuditLogEntry {
    adminId: string;
    actionType: string;
    resourceType: string;
    resourceId: string;
    reason?: string | undefined;
    previousState?: unknown;
    newState?: unknown;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
}

export interface AuditQueryParams {
    limit?: number | undefined;
    offset?: number | undefined;
    actorId?: string | undefined;
    actionType?: string | undefined;
    resourceType?: string | undefined;
    resourceId?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    search?: string | undefined;
}

export class AuditRepository {

    /**
     * Create an audit log entry (used by all services).
     */
    async log(entry: AuditLogEntry): Promise<void> {
        try {
            await db.insert(adminAuditLogsExtended).values({
                adminId: entry.adminId,
                actionType: entry.actionType,
                resourceType: entry.resourceType,
                resourceId: entry.resourceId,
                reason: entry.reason,
                previousState: entry.previousState,
                newState: entry.newState,
                ipAddress: entry.ipAddress,
                userAgent: entry.userAgent,
            });
        } catch (err) {
            // Audit logging should never block the main flow
            console.error("[AUDIT] Failed to write log:", err);
        }
    }

    /**
     * Query audit logs with filters and pagination.
     */
    async query(params: AuditQueryParams) {
        const {
            limit = 50,
            offset = 0,
            actorId,
            actionType,
            resourceType,
            resourceId,
            startDate,
            endDate,
            search,
        } = params;

        const conditions = [];

        if (actorId) {
            conditions.push(eq(adminAuditLogsExtended.adminId, actorId));
        }
        if (actionType) {
            conditions.push(eq(adminAuditLogsExtended.actionType, actionType));
        }
        if (resourceType) {
            conditions.push(eq(adminAuditLogsExtended.resourceType, resourceType));
        }
        if (resourceId) {
            conditions.push(eq(adminAuditLogsExtended.resourceId, resourceId));
        }
        if (startDate) {
            conditions.push(gte(adminAuditLogsExtended.createdAt, new Date(startDate)));
        }
        if (endDate) {
            conditions.push(lte(adminAuditLogsExtended.createdAt, new Date(endDate)));
        }
        if (search) {
            conditions.push(ilike(adminAuditLogsExtended.reason, `%${search}%`));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [logs, totalResult] = await Promise.all([
            db
                .select({
                    id: adminAuditLogsExtended.id,
                    adminId: adminAuditLogsExtended.adminId,
                    adminUsername: users.username,
                    adminName: users.name,
                    actionType: adminAuditLogsExtended.actionType,
                    resourceType: adminAuditLogsExtended.resourceType,
                    resourceId: adminAuditLogsExtended.resourceId,
                    reason: adminAuditLogsExtended.reason,
                    previousState: adminAuditLogsExtended.previousState,
                    newState: adminAuditLogsExtended.newState,
                    ipAddress: adminAuditLogsExtended.ipAddress,
                    userAgent: adminAuditLogsExtended.userAgent,
                    createdAt: adminAuditLogsExtended.createdAt,
                })
                .from(adminAuditLogsExtended)
                .leftJoin(users, eq(adminAuditLogsExtended.adminId, users.id))
                .where(whereClause)
                .orderBy(desc(adminAuditLogsExtended.createdAt))
                .limit(limit)
                .offset(offset),

            db
                .select({ count: count() })
                .from(adminAuditLogsExtended)
                .where(whereClause),
        ]);

        return {
            data: logs,
            total: totalResult[0]?.count || 0,
            limit,
            offset,
        };
    }

    /**
     * Get action summary for a specific resource.
     */
    async getResourceHistory(resourceType: string, resourceId: string) {
        return db
            .select({
                id: adminAuditLogsExtended.id,
                adminId: adminAuditLogsExtended.adminId,
                adminUsername: users.username,
                actionType: adminAuditLogsExtended.actionType,
                reason: adminAuditLogsExtended.reason,
                createdAt: adminAuditLogsExtended.createdAt,
            })
            .from(adminAuditLogsExtended)
            .leftJoin(users, eq(adminAuditLogsExtended.adminId, users.id))
            .where(
                and(
                    eq(adminAuditLogsExtended.resourceType, resourceType),
                    eq(adminAuditLogsExtended.resourceId, resourceId)
                )
            )
            .orderBy(desc(adminAuditLogsExtended.createdAt))
            .limit(100);
    }

    /**
     * Get admin activity metrics (for dashboards).
     */
    async getAdminActivityMetrics(timeRangeHours: number = 24) {
        const since = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);

        const results = await db
            .select({
                adminId: adminAuditLogsExtended.adminId,
                adminUsername: users.username,
                actionCount: count(),
            })
            .from(adminAuditLogsExtended)
            .leftJoin(users, eq(adminAuditLogsExtended.adminId, users.id))
            .where(gte(adminAuditLogsExtended.createdAt, since))
            .groupBy(adminAuditLogsExtended.adminId, users.username)
            .orderBy(desc(count()));

        return results;
    }

    /**
     * Get action type distribution (for monitoring abnormal spikes).
     */
    async getActionDistribution(timeRangeHours: number = 24) {
        const since = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);

        return db
            .select({
                actionType: adminAuditLogsExtended.actionType,
                count: count(),
            })
            .from(adminAuditLogsExtended)
            .where(gte(adminAuditLogsExtended.createdAt, since))
            .groupBy(adminAuditLogsExtended.actionType)
            .orderBy(desc(count()));
    }
}
