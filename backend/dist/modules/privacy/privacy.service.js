import { redis } from "../../config/redis.js";
import { PrivacyRepository } from "./privacy.repository.js";
import { AppError } from "../../utils/AppError.js";
export class PrivacyService {
    privacyRepository;
    constructor(privacyRepository) {
        this.privacyRepository = privacyRepository;
    }
    async getSettings(userId) {
        const cacheKey = `privacy:${userId}`;
        const cached = await redis.get(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const settings = await this.privacyRepository.getSettings(userId);
        // Default settings if none found
        const config = settings ? {
            profileVisibility: settings.profileVisibility,
            followersVisibility: settings.followersVisibility,
            followingVisibility: settings.followingVisibility,
            activityVisibility: settings.activityVisibility,
            searchVisibility: settings.searchVisibility,
        } : {
            profileVisibility: "PUBLIC",
            followersVisibility: "PUBLIC",
            followingVisibility: "PUBLIC",
            activityVisibility: "PUBLIC",
            searchVisibility: true,
        };
        await redis.set(cacheKey, JSON.stringify(config), "EX", 3600); // 1 hour cache
        return config;
    }
    async updateSettings(userId, data) {
        const updated = await this.privacyRepository.updateSettings(userId, data);
        // Invalidate cache
        const cacheKey = `privacy:${userId}`;
        await redis.del(cacheKey);
        return updated;
    }
    /**
     * The Evaluation Engine
     * Checks if actor can see target's profile attribute
     */
    async canView(actorId, targetId, attribute, isFollower = false, isBlocked = false) {
        if (isBlocked)
            return false;
        if (actorId === targetId)
            return true;
        const settings = await this.getSettings(targetId);
        const visibility = settings[attribute];
        if (visibility === "PUBLIC")
            return true;
        if (visibility === "FOLLOWERS" && isFollower)
            return true;
        if (visibility === "PRIVATE")
            return false;
        return false;
    }
}
//# sourceMappingURL=privacy.service.js.map