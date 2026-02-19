
import type { FastifyReply, FastifyRequest } from "fastify";
import type { EngagementService } from "./engagement.service.js";
import type { ToggleLikeInput, ReactInput, RepostInput } from "./engagement.schema.js";

export class EngagementController {
    constructor(private service: EngagementService) { }

    toggleLikeHandler = async (
        request: FastifyRequest<{ Body: ToggleLikeInput }>,
        reply: FastifyReply
    ) => {
        const userId = request.user!.sub;
        const { targetId, targetType } = request.body;
        const result = await this.service.toggleLike(userId, targetId, targetType);
        return reply.send(result);
    };

    reactHandler = async (
        request: FastifyRequest<{ Body: ReactInput }>,
        reply: FastifyReply
    ) => {
        const userId = request.user!.sub;
        const { targetId, targetType, type } = request.body;
        const result = await this.service.react(userId, targetId, targetType, type);
        return reply.send(result);
    };

    repostHandler = async (
        request: FastifyRequest<{ Body: RepostInput }>,
        reply: FastifyReply
    ) => {
        const userId = request.user!.sub;
        const { postId, quoteText } = request.body;
        const result = await this.service.repost(userId, postId, quoteText);
        return reply.status(201).send(result);
    };

    getStatsHandler = async (
        request: FastifyRequest<{ Params: { targetId: string } }>,
        reply: FastifyReply
    ) => {
        const { targetId } = request.params;
        const stats = await this.service.getEngagementStats(targetId);
        return reply.send(stats);
    };
}
