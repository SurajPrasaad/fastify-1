import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { z } from "zod";
import { RoomService } from "../../modules/room/room.service.js";
import { RoomRepository } from "../../modules/room/room.repository.js";

const repository = new RoomRepository();
const service = new RoomService(repository);

export const roomRouter = router({
    createRoom: protectedProcedure
        .input(z.object({
            title: z.string().min(1).max(255),
            maxSpeakers: z.number().optional().default(20)
        }))
        .mutation(async ({ input, ctx }) => {
            return await service.createRoom(ctx.user.id, input.title, ctx.io as any, input.maxSpeakers);
        }),

    getActiveRooms: publicProcedure
        .input(z.object({
            limit: z.number().optional().default(20),
            cursor: z.string().optional()
        }))
        .query(async ({ input }) => {
            return await service.getActiveRooms(input.limit, input.cursor);
        }),

    getRoom: publicProcedure
        .input(z.object({ roomId: z.string().uuid() }))
        .query(async ({ input }) => {
            return await service.getRoom(input.roomId);
        }),

    endRoom: protectedProcedure
        .input(z.object({ roomId: z.string().uuid() }))
        .mutation(async ({ input, ctx }) => {
            return await service.endRoom(input.roomId, ctx.user.id, ctx.io as any);
        }),

    raiseHand: protectedProcedure
        .input(z.object({ roomId: z.string().uuid() }))
        .mutation(async ({ input, ctx }) => {
            return await service.raiseHand(input.roomId, ctx.user.id, ctx.io as any);
        }),

    approveSpeaker: protectedProcedure
        .input(z.object({
            roomId: z.string().uuid(),
            listenerId: z.string().uuid()
        }))
        .mutation(async ({ input, ctx }) => {
            return await service.approveSpeaker(input.roomId, ctx.user.id, input.listenerId, ctx.io as any);
        }),

    demoteSpeaker: protectedProcedure
        .input(z.object({
            roomId: z.string().uuid(),
            speakerId: z.string().uuid()
        }))
        .mutation(async ({ input, ctx }) => {
            return await service.demoteSpeaker(input.roomId, ctx.user.id, input.speakerId, ctx.io as any);
        })
});
