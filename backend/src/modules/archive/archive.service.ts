/**
 * Archive & Legal Hold Service — Retention and legal hold
 */

import { ArchiveRepository } from "./archive.repository.js";
import { AppError } from "../../utils/AppError.js";

export class ArchiveService {
    private repository = new ArchiveRepository() as ArchiveRepository;

    async createArchiveRecord(data: {
        resourceType: "POST" | "USER" | "COMMENT";
        resourceId: string;
        archivedById?: string | null;
        retentionUntil?: Date | null;
        legalHoldId?: string | null;
        reason?: string | null;
    }) {
        return this.repository.createArchiveRecord(data);
    }

    async getArchiveRecord(resourceType: "POST" | "USER" | "COMMENT", resourceId: string) {
        return this.repository.findArchiveByResource(resourceType, resourceId);
    }

    async createLegalHold(data: {
        resourceType: "POST" | "USER" | "COMMENT";
        resourceId: string;
        reason: string;
        heldById: string;
    }) {
        const existing = await this.repository.findLegalHold(data.resourceType, data.resourceId);
        if (existing && !existing.releasedAt) {
            throw new AppError("Resource already under legal hold", 400);
        }
        return this.repository.createLegalHold(data);
    }

    async releaseLegalHold(holdId: string) {
        const hold = await this.repository.releaseLegalHold(holdId);
        if (!hold) throw new AppError("Legal hold not found", 404);
        return hold;
    }
}
