import type { FastifyReply, FastifyRequest } from "fastify";
export declare const healthcheck: (request: FastifyRequest, reply: FastifyReply) => Promise<never>;
export declare const livenessCheck: () => Promise<{
    status: string;
}>;
export declare const readinessCheck: () => Promise<{
    status: string;
}>;
//# sourceMappingURL=health.controller.d.ts.map