import { TRPCError } from "@trpc/server";
import { RoomRepository } from "./room.repository.js";
import { db } from "../../config/drizzle.js";
import { eq, and } from "drizzle-orm";
// Assume a redis cluster exported for Pub/Sub
import { Redis } from "ioredis";
import { Server } from "socket.io";

// Minimal redis publisher for event broadcasting in Fastify
const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export class RoomService {
    constructor(private readonly repository: RoomRepository) { }

    async createRoom(hostId: string, title: string, io: Server | null, maxSpeakers: number = 20) {
        if (!title.trim()) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Title must not be empty" });
        }

        const room = await this.repository.createRoom(hostId, title, maxSpeakers);

        if (!room || !room.id) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create room" });
        }

        // Broadcast via Socket.IO directly to general platform if needed (optional)
        // io?.emit("platform:new_room", room)
        return room;
    }

    async getRoom(roomId: string) {
        const room = await this.repository.getRoomById(roomId);
        if (!room) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
        }

        // Fetch raised hands from Redis
        const raisedHands = await redisClient.zrange(`room:${roomId}:hands`, 0, -1);

        return {
            ...room,
            raisedHands: raisedHands || []
        };
    }

    async getActiveRooms(limit: number, cursor?: string) {
        return await this.repository.getActiveRooms(limit, cursor);
    }

    async endRoom(roomId: string, hostId: string, io: Server | null) {
        const room = await this.repository.endRoom(roomId, hostId);

        if (!room) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Room not found or unauthorized to close" });
        }

        // Notify all sockets in the specific room
        this.broadcastToRoom(io, roomId, "room:ended", { roomId });
        return room;
    }

    async raiseHand(roomId: string, userId: string, io: Server | null) {
        const timeScored = Date.now();
        await redisClient.zadd(`room:${roomId}:hands`, timeScored, userId);

        // Notify host by broadcasting to the room (or specific host socket)
        this.broadcastToRoom(io, roomId, "room:hand_raised", { roomId, userId });

        return { success: true };
    }

    async approveSpeaker(roomId: string, hostId: string, listenerId: string, io: Server | null) {
        const room = await this.getRoom(roomId);
        if (room.hostId !== hostId && room.status === "ACTIVE") {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Only the host can approve a speaker" });
        }

        const participant = await this.repository.updateParticipantRole(roomId, listenerId, "SPEAKER");
        if (!participant) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Participant not found" });
        }

        await redisClient.zrem(`room:${roomId}:hands`, listenerId);
        await redisClient.sadd(`room:${roomId}:speakers`, listenerId);

        this.broadcastToRoom(io, roomId, "room:speaker_approved", { roomId, userId: listenerId });

        return { success: true };
    }

    async demoteSpeaker(roomId: string, hostId: string, speakerId: string, io: Server | null) {
        const room = await this.getRoom(roomId);
        if (room.hostId !== hostId) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Only the host can demote a speaker" });
        }

        if (speakerId === hostId) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot demote the host" });
        }

        const participant = await this.repository.updateParticipantRole(roomId, speakerId, "LISTENER");
        if (!participant) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Participant not found" });
        }

        await redisClient.srem(`room:${roomId}:speakers`, speakerId);

        this.broadcastToRoom(io, roomId, "room:speaker_demoted", { roomId, userId: speakerId });

        return { success: true };
    }

    private broadcastToRoom(io: Server | null, roomId: string, event: string, payload: unknown) {
        if (io) {
            io.to(`room:${roomId}`).emit(event, payload);
        } else {
            // Fallback publish directly if IO is totally unavailable on this process
            redisClient.publish(`pubsub:room:${roomId}`, JSON.stringify({ event, payload }));
        }
    }
}
