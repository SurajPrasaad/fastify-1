import { db } from "../../config/drizzle.js";
import { userPrivacy } from "../../db/schema.js";
import { eq } from "drizzle-orm";
export class PrivacyRepository {
    async getSettings(userId) {
        const [settings] = await db
            .select()
            .from(userPrivacy)
            .where(eq(userPrivacy.userId, userId))
            .limit(1);
        return settings;
    }
    async updateSettings(userId, data) {
        return await db
            .insert(userPrivacy)
            .values({ ...data, userId })
            .onConflictDoUpdate({
            target: userPrivacy.userId,
            set: { ...data, updatedAt: new Date() }
        })
            .returning();
    }
}
//# sourceMappingURL=privacy.repository.js.map