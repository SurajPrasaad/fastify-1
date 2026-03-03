/**
 * Appeals Service — Business logic for user appeals
 */

import { AppealsRepository } from "./appeals.repository.js";
import { AuditService } from "../audit/audit.service.js";
import type { CreateAppealInput, ReviewAppealInput } from "./appeals.schema.js";
import { AppError } from "../../utils/AppError.js";

export class AppealsService {
    private readonly repository = new AppealsRepository();
    private readonly auditService = new AuditService();

    async create(data: CreateAppealInput & { userId: string }, requestContext?: { ipAddress?: string; userAgent?: string }) {
        const appeal = await this.repository.create({
            userId: data.userId,
            resourceType: data.resourceType,
            resourceId: data.resourceId,
            enforcementType: data.enforcementType,
            originalModerationLogId: data.originalModerationLogId ?? null,
            userMessage: data.userMessage,
            evidenceUrls: data.evidenceUrls,
        });
        if (appeal) {
            this.auditService.logFromRequest(
                data.userId,
                "APPEAL_SUBMIT",
                "APPEAL",
                appeal.id,
                { newState: { appealId: appeal.id, resourceType: data.resourceType }, ipAddress: requestContext?.ipAddress, userAgent: requestContext?.userAgent }
            );
        }
        return appeal!;
    }

    async getById(id: string) {
        const appeal = await this.repository.findById(id);
        if (!appeal) throw new AppError("Appeal not found", 404);
        return appeal;
    }

    async list(params: {
        limit?: number;
        offset?: number;
        status?: "PENDING" | "APPROVED" | "REJECTED" | "MODIFIED";
        userId?: string;
        resourceType?: "POST" | "USER" | "COMMENT";
        enforcementType?: import("./appeals.repository.js").EnforcementType;
    }) {
        return this.repository.list(params);
    }

    async review(
        data: ReviewAppealInput & { reviewerId: string },
        requestContext?: { ipAddress?: string; userAgent?: string }
    ) {
        const existing = await this.repository.findById(data.appealId);
        if (!existing) throw new AppError("Appeal not found", 404);
        if (existing.status !== "PENDING") throw new AppError("Appeal already reviewed", 400);

        const updated = await this.repository.review({
            appealId: data.appealId,
            reviewerId: data.reviewerId,
            decision: data.decision,
            justification: data.justification,
            policyReference: data.policyReference ?? null,
            internalNote: data.internalNote ?? null,
        });
        this.auditService.logFromRequest(
            data.reviewerId,
            `APPEAL_${data.decision}`,
            "APPEAL",
            data.appealId,
            {
                reason: data.justification,
                previousState: { status: "PENDING" },
                newState: { status: data.decision },
                ipAddress: requestContext?.ipAddress,
                userAgent: requestContext?.userAgent,
            }
        );
        return updated;
    }

    async getPendingCount() {
        return this.repository.getPendingCount();
    }
}
