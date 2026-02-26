import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../../config/drizzle.js';
import { callHistory, users } from '../../db/schema.js';
import { eq, or, desc, aliasedTable } from 'drizzle-orm';
import { AppError } from '../../utils/AppError.js';

export async function callRoutes(app: FastifyInstance) {
    app.get('/history', async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).session?.userId;
        if (!userId) {
            throw new AppError("Unauthorized", 401);
        }

        const callerAlias = aliasedTable(users, "caller");
        const receiverAlias = aliasedTable(users, "receiver");

        const history = await db.select({
            id: callHistory.id,
            callerId: callHistory.callerId,
            receiverId: callHistory.receiverId,
            callType: callHistory.callType,
            status: callHistory.status,
            durationSeconds: callHistory.durationSeconds,
            startedAt: callHistory.startedAt,
            endedAt: callHistory.endedAt,
            caller: {
                id: callerAlias.id,
                name: callerAlias.name,
                username: callerAlias.username,
                avatarUrl: callerAlias.avatarUrl
            },
            receiver: {
                id: receiverAlias.id,
                name: receiverAlias.name,
                username: receiverAlias.username,
                avatarUrl: receiverAlias.avatarUrl
            }
        })
            .from(callHistory)
            .leftJoin(callerAlias, eq(callHistory.callerId, callerAlias.id))
            .leftJoin(receiverAlias, eq(callHistory.receiverId, receiverAlias.id))
            .where(
                or(
                    eq(callHistory.callerId, userId),
                    eq(callHistory.receiverId, userId)
                )
            )
            .orderBy(desc(callHistory.startedAt))
            .limit(50);

        return history;
    });

    app.delete('/history/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const userId = (request as any).session?.userId;
        const { id } = request.params;

        if (!userId) throw new AppError("Unauthorized", 401);

        // Verify ownership before delete
        const log = await db.select().from(callHistory).where(eq(callHistory.id, id)).limit(1);
        if (!log[0]) throw new AppError("Call log not found", 404);

        if (log[0].callerId !== userId && log[0].receiverId !== userId) {
            throw new AppError("Forbidden", 403);
        }

        await db.delete(callHistory).where(eq(callHistory.id, id));
        return { success: true };
    });
}
