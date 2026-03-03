/**
 * Appeals Repository — Data access for user appeals
 */

import { db } from "../../config/drizzle.js";
import { appeals, users } from "../../db/schema.js";
import { and, desc, eq, count } from "drizzle-orm";

export type AppealStatus = "PENDING" | "APPROVED" | "REJECTED" | "MODIFIED";
export type EnforcementType =
    | "CONTENT_REMOVAL"
    | "TEMPORARY_SUSPENSION"
    | "PERMANENT_BAN"
    | "ACCOUNT_RESTRICTION"
    | "OVERRIDE_DECISION";

export interface CreateAppealData {
    userId: string;
    resourceType: "POST" | "USER" | "COMMENT";
    resourceId: string;
    enforcementType: EnforcementType;
    originalModerationLogId?: string | null;
    userMessage: string;
    evidenceUrls?: string[];
}

export interface ReviewAppealData {
    appealId: string;
    reviewerId: string;
    decision: AppealStatus;
    justification: string;
    policyReference?: string | null;
    internalNote?: string | null;
}

export interface ListAppealsParams {
    limit?: number;
    offset?: number;
    status?: AppealStatus;
    userId?: string;
    resourceType?: string;
    enforcementType?: EnforcementType;
}

export class AppealsRepository {
    async create(data: CreateAppealData) {
        const [row] = await db
            .insert(appeals)
            .values({
                userId: data.userId,
                resourceType: data.resourceType,
                resourceId: data.resourceId,
                enforcementType: data.enforcementType,
                originalModerationLogId: data.originalModerationLogId ?? null,
                userMessage: data.userMessage,
                evidenceUrls: data.evidenceUrls ?? [],
                status: "PENDING",
            })
            .returning();
        return row;
    }

    async findById(id: string) {
        const [row] = await db
            .select({
                id: appeals.id,
                userId: appeals.userId,
                resourceType: appeals.resourceType,
                resourceId: appeals.resourceId,
                enforcementType: appeals.enforcementType,
                originalModerationLogId: appeals.originalModerationLogId,
                status: appeals.status,
                reviewerId: appeals.reviewerId,
                reviewedAt: appeals.reviewedAt,
                userMessage: appeals.userMessage,
                evidenceUrls: appeals.evidenceUrls,
                justification: appeals.justification,
                policyReference: appeals.policyReference,
                internalNote: appeals.internalNote,
                createdAt: appeals.createdAt,
                updatedAt: appeals.updatedAt,
                userName: users.name,
                userUsername: users.username,
            })
            .from(appeals)
            .innerJoin(users, eq(appeals.userId, users.id))
            .where(eq(appeals.id, id))
            .limit(1);
        return row ?? null;
    }

    async list(params: ListAppealsParams) {
        const { limit = 20, offset = 0, status, userId, resourceType, enforcementType } = params;
        const conditions = [];
        if (status) conditions.push(eq(appeals.status, status));
        if (userId) conditions.push(eq(appeals.userId, userId));
        if (resourceType) conditions.push(eq(appeals.resourceType, resourceType as "POST" | "USER" | "COMMENT"));
        if (enforcementType) conditions.push(eq(appeals.enforcementType, enforcementType));
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [rows, totalResult] = await Promise.all([
            db
                .select({
                    id: appeals.id,
                    userId: appeals.userId,
                    resourceType: appeals.resourceType,
                    resourceId: appeals.resourceId,
                    enforcementType: appeals.enforcementType,
                    status: appeals.status,
                    reviewerId: appeals.reviewerId,
                    reviewedAt: appeals.reviewedAt,
                    createdAt: appeals.createdAt,
                    userName: users.name,
                    userUsername: users.username,
                })
                .from(appeals)
                .innerJoin(users, eq(appeals.userId, users.id))
                .where(whereClause)
                .orderBy(desc(appeals.createdAt))
                .limit(limit)
                .offset(offset),
            whereClause
                ? db.select({ count: count() }).from(appeals).where(whereClause)
                : db.select({ count: count() }).from(appeals),
        ]);

        const total = totalResult[0]?.count ?? 0;
        return { items: rows, total };
    }

    async review(data: ReviewAppealData) {
        const [row] = await db
            .update(appeals)
            .set({
                status: data.decision,
                reviewerId: data.reviewerId,
                reviewedAt: new Date(),
                justification: data.justification,
                policyReference: data.policyReference ?? null,
                internalNote: data.internalNote ?? null,
                updatedAt: new Date(),
            })
            .where(eq(appeals.id, data.appealId))
            .returning();
        return row ?? null;
    }

    async getPendingCount(): Promise<number> {
        const [r] = await db
            .select({ count: count() })
            .from(appeals)
            .where(eq(appeals.status, "PENDING"));
        return r?.count ?? 0;
    }
}
