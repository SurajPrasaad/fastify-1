import type { FastifyInstance } from 'fastify';
import type { Socket, Server } from 'socket.io';
import { RoomRepository } from './room.repository.js';
import { z } from 'zod';
import { db } from '../../config/drizzle.js';

const roomJoinSchema = z.object({
    roomId: z.string().uuid()
});

/**
 * Gateway to handle WebRTC audio streaming, listener state,
 * and routing signals for Group Audio Rooms.
 */
export async function roomGateway(app: FastifyInstance) {
    app.ready((err) => {
        if (err) throw err;

        const io = (app as any).io as Server;
        if (!io) return;

        const repository = new RoomRepository();

        io.on('connection', async (socket: Socket) => {
            const userId = socket.data?.userId as string;

            if (!userId) return;

            // 1. Join Audio Room
            socket.on('audio_room:join', async (payload) => {
                try {
                    const { roomId } = roomJoinSchema.parse(payload);

                    // Check if user is host
                    const room = await repository.getRoomById(roomId);
                    const isHost = room?.hostId === userId;
                    const role = isHost ? "HOST" : "LISTENER";

                    // Persist join in DB
                    await repository.addParticipant(roomId, userId, role);

                    // Fetch user details for broadcasting
                    const user = await db.query.users.findFirst({
                        where: (u: any, { eq }: any) => eq(u.id, userId),
                        columns: { id: true, username: true, name: true, avatarUrl: true }
                    });

                    socket.join(`room:${roomId}`);
                    socket.emit('audio_room:joined', { roomId, role });

                    // Broadcast with user info so UI can render immediately
                    io.to(`room:${roomId}`).emit('audio_room:participant_joined', {
                        userId,
                        user,
                        role
                    });
                } catch (err: any) {
                    socket.emit('error', { code: 'INVALID_REQUEST', message: err.message });
                }
            });

            // 2. Leave Audio Room
            socket.on('audio_room:leave', async (payload) => {
                try {
                    const { roomId } = roomJoinSchema.parse(payload);
                    await repository.removeParticipant(roomId, userId);
                    socket.leave(`room:${roomId}`);

                    io.to(`room:${roomId}`).emit('audio_room:participant_left', { userId });
                } catch (err: any) {
                    socket.emit('error', { code: 'INVALID_REQUEST', message: err.message });
                }
            });

            // Handle disconnect if in a room
            socket.on('disconnecting', async () => {
                const roomsSids = Array.from(socket.rooms);
                for (const r of roomsSids) {
                    if (r.startsWith('room:')) {
                        const roomId = r.replace('room:', '');
                        await repository.removeParticipant(roomId, userId);
                        socket.to(r).emit('audio_room:participant_left', { userId });
                    }
                }
            });

            // 3. Request SFU Transport (Placeholder for actual Mediasoup allocation)
            socket.on('audio_room:request_transport', async (payload, callback) => {
                try {
                    const { roomId } = roomJoinSchema.parse(payload);
                    if (typeof callback === 'function') {
                        callback({
                            success: true,
                            transportOptions: { id: "mock-id", iceParameters: {}, iceCandidates: [], dtlsParameters: {} }
                        });
                    }
                } catch (err: any) {
                    socket.emit('error', { code: 'TRANSPORT_FAILED', message: err.message });
                }
            });

            // 4. Connect WebRTC Transport
            socket.on('audio_room:connect_transport', async (payload, callback) => {
                if (typeof callback === 'function') callback({ success: true });
            });

            // 5. Produce Audio
            socket.on('audio_room:produce', async (payload, callback) => {
                if (typeof callback === 'function') {
                    callback({ success: true, producerId: "mock-producer-id" });
                }
                socket.to(`room:${payload.roomId}`).emit('audio_room:new_producer', {
                    producerId: "mock-producer-id",
                    userId
                });
            });

            // 6. Consume Audio
            socket.on('audio_room:consume', async (payload, callback) => {
                if (typeof callback === 'function') {
                    callback({
                        success: true,
                        consumerOptions: { id: "mock-consumer", producerId: payload.producerId, kind: "audio", rtpParameters: {} }
                    });
                }
            });
        });
    });
}
