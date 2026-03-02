/**
 * Audit Service — Centralized Audit Logging
 * 
 * All privileged actions across the system are logged here.
 * Used by Admin, Moderation, and User services.
 */

import { AuditRepository, type AuditLogEntry, type AuditQueryParams } from "./audit.repository.js";

export class AuditService {
    private repository = new AuditRepository();

    /**
     * Log a privileged action (non-blocking).
     */
    async log(entry: AuditLogEntry): Promise<void> {
        // Fire-and-forget — never block the main request
        this.repository.log(entry).catch((err) => {
            console.error("[AUDIT_SERVICE] Failed to persist log:", err);
        });
    }

    /**
     * Log with request context (convenience method).
     */
    async logFromRequest(
        actorId: string,
        actionType: string,
        resourceType: string,
        resourceId: string,
        context: {
            reason?: string | undefined;
            previousState?: unknown;
            newState?: unknown;
            ipAddress?: string | undefined;
            userAgent?: string | undefined;
        }
    ): Promise<void> {
        await this.log({
            adminId: actorId,
            actionType,
            resourceType,
            resourceId,
            reason: context.reason,
            previousState: context.previousState,
            newState: context.newState,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
        });
    }

    /**
     * Query audit logs (admin dashboard).
     */
    async queryLogs(params: AuditQueryParams) {
        return this.repository.query(params);
    }

    /**
     * Get full history for a specific entity.
     */
    async getEntityHistory(resourceType: string, resourceId: string) {
        return this.repository.getResourceHistory(resourceType, resourceId);
    }

    /**
     * Get admin activity summary.
     */
    async getAdminActivity(timeRangeHours: number = 24) {
        return this.repository.getAdminActivityMetrics(timeRangeHours);
    }

    /**
     * Get action distribution (for spike detection).
     */
    async getActionDistribution(timeRangeHours: number = 24) {
        return this.repository.getActionDistribution(timeRangeHours);
    }
}
