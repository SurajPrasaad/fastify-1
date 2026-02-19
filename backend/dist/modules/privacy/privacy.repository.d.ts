import { userPrivacy } from "../../db/schema.js";
export declare class PrivacyRepository {
    getSettings(userId: string): Promise<{
        userId: string;
        profileVisibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
        followersVisibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
        followingVisibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
        activityVisibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
        searchVisibility: boolean;
        updatedAt: Date;
    } | undefined>;
    updateSettings(userId: string, data: Partial<typeof userPrivacy.$inferInsert>): Promise<{
        updatedAt: Date;
        userId: string;
        profileVisibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
        followersVisibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
        followingVisibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
        activityVisibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
        searchVisibility: boolean;
    }[]>;
}
//# sourceMappingURL=privacy.repository.d.ts.map