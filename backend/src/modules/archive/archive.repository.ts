/**
 * Archive & Legal Hold Repository — Data access
 */

import { db } from "../../config/drizzle.js";
import { archiveRecords, legalHolds } from "../../db/schema.js";
import { eq, and, desc, lte } from "drizzle-orm";

export type ResourceType = "POST" | "USER" | "COMMENT";

export interface CreateArchiveRecordData {
    resourceType: ResourceType;
    resourceId: string;
    archivedById?: string | null;
    retentionUntil?: Date | null;
    legalHoldId?: string | null;
    reason?: string | null;
}

export interface CreateLegalHoldData {
    resourceType: ResourceType;
    resourceId: string;
    reason: string;
    heldById: string;
}

export class ArchiveRepository {
    async createArchiveRecord(data: CreateArchiveRecordData) {
        const [row] = await db
            .insert(archiveRecords)
            .values({
                resourceType: data.resourceType,
                resourceId: data.resourceId,
                archivedById: data.archivedById ?? null,
                retentionUntil: data.retentionUntil ?? null,
                legalHoldId: data.legalHoldId ?? null,
                reason: data.reason ?? null,
            })
            .returning();
        return row;
    }

    async findArchiveByResource(resourceType: ResourceType, resourceId: string) {
        const [row] = await db
            .select()
            .from(archiveRecords)
            .where(and(eq(archiveRecords.resourceType, resourceType), eq(archiveRecords.resourceId, resourceId)))
            .orderBy(desc(archiveRecords.archivedAt))
            .limit(1);
        return row ?? null;
    }

    async createLegalHold(data: CreateLegalHoldData) {
        const [row] = await db.insert(legalHolds).values(data).returning();
        return row;
    }

    async findLegalHold(resourceType: ResourceType, resourceId: string) {
        const [row] = await db
            .select()
            .from(legalHolds)
            .where(and(eq(legalHolds.resourceType, resourceType), eq(legalHolds.resourceId, resourceId)))
            .orderBy(desc(legalHolds.heldAt))
            .limit(1);
        return row ?? null;
    }

    async releaseLegalHold(holdId: string) {
        const [row] = await db
            .update(legalHolds)
            .set({ releasedAt: new Date() })
            .where(eq(legalHolds.id, holdId))
            .returning();
        return row ?? null;
    }
}
