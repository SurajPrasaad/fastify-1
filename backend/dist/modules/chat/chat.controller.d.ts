import type { FastifyReply, FastifyRequest } from "fastify";
export declare function createRoomHandler(request: FastifyRequest<{
    Body: any;
}>, reply: FastifyReply): Promise<never>;
export declare function getConversationsHandler(request: FastifyRequest<{
    Querystring: any;
}>, reply: FastifyReply): Promise<never>;
export declare function getHistoryHandler(request: FastifyRequest<{
    Params: {
        roomId: string;
    };
    Querystring: any;
}>, reply: FastifyReply): Promise<never>;
export declare function getPresenceHandler(request: FastifyRequest<{
    Params: {
        userId: string;
    };
}>, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=chat.controller.d.ts.map