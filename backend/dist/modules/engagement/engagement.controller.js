export class EngagementController {
    service;
    constructor(service) {
        this.service = service;
    }
    toggleLikeHandler = async (request, reply) => {
        const userId = request.user.sub;
        const { targetId, targetType } = request.body;
        const result = await this.service.toggleLike(userId, targetId, targetType);
        return reply.send(result);
    };
    reactHandler = async (request, reply) => {
        const userId = request.user.sub;
        const { targetId, targetType, type } = request.body;
        const result = await this.service.react(userId, targetId, targetType, type);
        return reply.send(result);
    };
    repostHandler = async (request, reply) => {
        const userId = request.user.sub;
        const { postId, quoteText } = request.body;
        const result = await this.service.repost(userId, postId, quoteText);
        return reply.status(201).send(result);
    };
    getStatsHandler = async (request, reply) => {
        const { targetId } = request.params;
        const stats = await this.service.getEngagementStats(targetId);
        return reply.send(stats);
    };
}
//# sourceMappingURL=engagement.controller.js.map