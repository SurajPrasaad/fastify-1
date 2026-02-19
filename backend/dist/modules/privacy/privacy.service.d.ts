import { PrivacyRepository } from "./privacy.repository.js";
import type { PrivacyConfigDto } from "./privacy.dto.js";
export declare class PrivacyService {
    private privacyRepository;
    constructor(privacyRepository: PrivacyRepository);
    getSettings(userId: string): Promise<PrivacyConfigDto>;
    updateSettings(userId: string, data: Partial<PrivacyConfigDto>): Promise<{
        updatedAt: Date;
        userId: string;
        profileVisibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
        followersVisibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
        followingVisibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
        activityVisibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
        searchVisibility: boolean;
    }[]>;
    /**
     * The Evaluation Engine
     * Checks if actor can see target's profile attribute
     */
    canView(actorId: string | null, targetId: string, attribute: keyof PrivacyConfigDto, isFollower?: boolean, isBlocked?: boolean): Promise<boolean>;
}
//# sourceMappingURL=privacy.service.d.ts.map