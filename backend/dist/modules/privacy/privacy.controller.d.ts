import type { FastifyReply, FastifyRequest } from "fastify";
import type { PrivacyService } from "./privacy.service.js";
import type { UpdatePrivacyDto } from "./privacy.dto.js";
export declare class PrivacyController {
    private privacyService;
    constructor(privacyService: PrivacyService);
    getSettingsHandler: (request: FastifyRequest, reply: FastifyReply) => Promise<{
        profileVisibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
        followersVisibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
        followingVisibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
        activityVisibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
        searchVisibility: boolean;
    }>;
    updateSettingsHandler: (request: FastifyRequest<{
        Body: UpdatePrivacyDto;
    }>, reply: FastifyReply) => Promise<{
        updatedAt: Date;
        userId: string;
        profileVisibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
        followersVisibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
        followingVisibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
        activityVisibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
        searchVisibility: boolean;
    }[]>;
}
//# sourceMappingURL=privacy.controller.d.ts.map