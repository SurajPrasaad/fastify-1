import { eq, or, desc, sql, and } from "drizzle-orm";
import { db } from "../../config/drizzle.js";
import { rooms, roomParticipants } from "../../db/schema.js";

export class RoomRepository {
    async createRoom(hostId: string, title: string, maxSpeakers: number = 20) {
        const [room] = await db.insert(rooms).values({
            hostId,
            title,
            maxSpeakers,
            status: "ACTIVE", // Start as active for now
            startedAt: new Date(),
        }).returning();

        if (!room) {
            throw new Error("Failed to create room");
        }

        // Add host as a participant automatically
        await db.insert(roomParticipants).values({
            roomId: room.id!,
            userId: hostId,
            role: "HOST",
            joinedAt: new Date(),
        });

        return room;
    }

    async getRoomById(roomId: string) {
        return await db.query.rooms.findFirst({
            where: eq(rooms.id, roomId),
            with: {
                host: {
                    columns: { id: true, username: true, name: true, avatarUrl: true },
                },
                participants: {
                    where: sql`${roomParticipants.leftAt} IS NULL`,
                    with: {
                        user: {
                            columns: { id: true, username: true, name: true, avatarUrl: true },
                        },
                    },
                },
            },
        });
    }

    async getActiveRooms(limit: number = 20, cursor?: string) {
        // Query ACTIVE rooms
        const query = db.query.rooms.findMany({
            where: and(
                eq(rooms.status, "ACTIVE"),
                cursor ? sql`${rooms.createdAt} < ${new Date(cursor).toISOString()}` : undefined
            ),
            orderBy: [desc(rooms.createdAt)],
            limit: limit + 1,
            with: {
                host: {
                    columns: { id: true, username: true, name: true, avatarUrl: true },
                },
            },
        });

        const results = await query;
        let nextCursor: typeof cursor = undefined;
        if (results.length > limit) {
            const nextItem = results.pop();
            nextCursor = nextItem?.createdAt.toISOString();
        }

        return { rooms: results, nextCursor };
    }

    async endRoom(roomId: string, hostId: string) {
        const [updatedRoom] = await db.update(rooms)
            .set({
                status: "ENDED",
                endedAt: new Date()
            })
            .where(and(eq(rooms.id, roomId), eq(rooms.hostId, hostId)))
            .returning();

        return updatedRoom;
    }

    async addParticipant(roomId: string, userId: string, role: "HOST" | "SPEAKER" | "LISTENER") {
        const [participant] = await db.insert(roomParticipants).values({
            roomId,
            userId,
            role,
            joinedAt: new Date(),
        }).onConflictDoUpdate({
            target: [roomParticipants.roomId, roomParticipants.userId],
            set: { leftAt: null, role } // Re-join logic, update role
        }).returning();

        return participant;
    }

    async removeParticipant(roomId: string, userId: string) {
        const [participant] = await db.update(roomParticipants)
            .set({ leftAt: new Date() })
            .where(and(eq(roomParticipants.roomId, roomId), eq(roomParticipants.userId, userId)))
            .returning();

        return participant;
    }

    async getRoomParticipants(roomId: string) {
        return await db.query.roomParticipants.findMany({
            where: and(eq(roomParticipants.roomId, roomId), sql`${roomParticipants.leftAt} IS NULL`),
            with: {
                user: {
                    columns: { id: true, username: true, name: true, avatarUrl: true },
                },
            },
        });
    }

    async updateParticipantRole(roomId: string, userId: string, role: "HOST" | "SPEAKER" | "LISTENER") {
        const [participant] = await db.update(roomParticipants)
            .set({ role })
            .where(and(eq(roomParticipants.roomId, roomId), eq(roomParticipants.userId, userId)))
            .returning();

        return participant;
    }
}
