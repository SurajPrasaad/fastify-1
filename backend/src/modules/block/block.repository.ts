import { db } from "../../config/drizzle.js";
import { blocks, follows } from "../../db/schema.js";
import { eq, and } from "drizzle-orm";
import { AppError } from "../../utils/AppError.js";

export class BlockRepository {
    async blockUser(blockerId: string, blockedId: string) {
        return await db.transaction(async (tx) => {
            // 1. Insert block record
            await tx.insert(blocks).values({
                blockerId,
                blockedId,
            }).onConflictDoNothing();

            // 2. Automatic unfollow in both directions
            await tx.delete(follows).where(
                and(
                    eq(follows.followerId, blockerId),
                    eq(follows.followingId, blockedId)
                )
            );

            await tx.delete(follows).where(
                and(
                    eq(follows.followerId, blockedId),
                    eq(follows.followingId, blockerId)
                )
            );

            // Note: In a real FAANG system, we'd also emit a Kafka event here
            // to update counters asynchronously and invalidate caches.
            return { success: true };
        });
    }

    async unblockUser(blockerId: string, blockedId: string) {
        await db.delete(blocks).where(
            and(
                eq(blocks.blockerId, blockerId),
                eq(blocks.blockedId, blockedId)
            )
        );
        return { success: true };
    }

    async isBlocked(blockerId: string, blockedId: string) {
        const [result] = await db
            .select()
            .from(blocks)
            .where(
                and(
                    eq(blocks.blockerId, blockerId),
                    eq(blocks.blockedId, blockedId)
                )
            )
            .limit(1);
        return !!result;
    }

    async getBlockedUsers(blockerId: string) {
        return await db.query.blocks.findMany({
            where: eq(blocks.blockerId, blockerId),
            with: {
                blocked: true
            },
            orderBy: (blocks, { desc }) => [desc(blocks.createdAt)],
        });
    }
}
