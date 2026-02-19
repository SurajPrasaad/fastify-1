import type { FastifyReply, FastifyRequest } from "fastify";
import type { PrivacyService } from "./privacy.service.js";
import type { PrivacyConfigDto, UpdatePrivacyDto } from "./privacy.dto.js";

export class PrivacyController {
    constructor(private privacyService: PrivacyService) { }

    getSettingsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = request.user!.sub;
        return this.privacyService.getSettings(userId);
    };

    updateSettingsHandler = async (
        request: FastifyRequest<{ Body: UpdatePrivacyDto }>,
        reply: FastifyReply
    ) => {
        const userId = request.user!.sub;
        // Handle exactOptionalPropertyTypes: true by stripping undefined values
        const data = Object.fromEntries(
            Object.entries(request.body).filter(([_, v]) => v !== undefined)
        ) as Partial<PrivacyConfigDto>;

        return this.privacyService.updateSettings(userId, data);
    };
}
