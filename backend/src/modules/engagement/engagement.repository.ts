
import { db } from "../../config/drizzle.js";
import { likes, reactions, reposts, engagementCounters } from "../../db/schema.js";
import { and, eq, sql } from "drizzle-orm";

export class EngagementRepository {
    async toggleLike(userId: string, targetId: string, targetType: "POST" | "COMMENT") {
        return await db.transaction(async (tx) => {
            const existing = await tx
                .select()
                .from(likes)
                .where(
                    and(
                        eq(likes.userId, userId),
                        eq(likes.targetId, targetId),
                        eq(likes.targetType, targetType)
                    )
                )
                .limit(1);

            if (existing.length > 0) {
                await tx
                    .delete(likes)
                    .where(
                        and(
                            eq(likes.userId, userId),
                            eq(likes.targetId, targetId),
                            eq(likes.targetType, targetType)
                        )
                    );

                await this.updateDBCounter(tx, targetId, targetType, { likesCount: -1 });
                return { action: "UNLIKED" };
            } else {
                await tx.insert(likes).values({ userId, targetId, targetType });
                await this.updateDBCounter(tx, targetId, targetType, { likesCount: 1 });
                return { action: "LIKED" };
            }
        });
    }

    async upsertReaction(userId: string, targetId: string, targetType: "POST" | "COMMENT", type: string) {
        return await db.transaction(async (tx) => {
            const [existing] = await tx
                .select()
                .from(reactions)
                .where(
                    and(
                        eq(reactions.userId, userId),
                        eq(reactions.targetId, targetId),
                        eq(reactions.targetType, targetType)
                    )
                )
                .limit(1);

            if (existing) {
                if (existing.type === type) {
                    await tx.delete(reactions).where(and(eq(reactions.userId, userId), eq(reactions.targetId, targetId)));
                    await this.updateDBReactionCounter(tx, targetId, targetType, existing.type, -1);
                    return { action: "REMOVED" };
                }

                await tx.update(reactions).set({ type: type as any }).where(and(eq(reactions.userId, userId), eq(reactions.targetId, targetId)));
                await this.updateDBReactionCounter(tx, targetId, targetType, existing.type, -1);
                await this.updateDBReactionCounter(tx, targetId, targetType, type, 1);
                return { action: "UPDATED" };
            }

            await tx.insert(reactions).values({ userId, targetId, targetType, type: type as any });
            await this.updateDBReactionCounter(tx, targetId, targetType, type, 1);
            return { action: "ADDED" };
        });
    }

    async createRepost(userId: string, postId: string, quoteText?: string) {
        return await db.transaction(async (tx) => {
            const [repost] = await tx
                .insert(reposts)
                .values({ userId, postId, quoteText })
                .returning();

            await this.updateDBCounter(tx, postId, "POST", { repostsCount: 1 });
            return repost;
        });
    }

    private async updateDBCounter(tx: any, targetId: string, targetType: string, updates: Record<string, number>) {
        const set: any = { updatedAt: new Date() };
        for (const [key, val] of Object.entries(updates)) {
            set[key] = sql`${engagementCounters[key as keyof typeof engagementCounters]} + ${val}`;
        }

        await tx
            .insert(engagementCounters)
            .values({ targetId, targetType, ...updates } as any)
            .onConflictDoUpdate({
                target: engagementCounters.targetId,
                set
            });
    }

    private async updateDBReactionCounter(tx: any, targetId: string, targetType: string, type: string, val: number) {
        await tx
            .insert(engagementCounters)
            .values({
                targetId,
                targetType,
                reactionsCount: { [type]: val > 0 ? 1 : 0 }
            } as any)
            .onConflictDoUpdate({
                target: engagementCounters.targetId,
                set: {
                    reactionsCount: sql`jsonb_set(
                        COALESCE(${engagementCounters.reactionsCount}, '{}'::jsonb), 
                        '{${sql.raw(type)}}', 
                        (COALESCE(${engagementCounters.reactionsCount}->>'${sql.raw(type)}', '0')::int + ${val})::text::jsonb
                    )`,
                    updatedAt: new Date()
                }
            });
    }

    async getCounters(targetId: string) {
        const [counter] = await db
            .select()
            .from(engagementCounters)
            .where(eq(engagementCounters.targetId, targetId))
            .limit(1);
        return counter;
    }
}
