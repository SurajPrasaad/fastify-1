import "fastify";
import "@fastify/session";

declare module "fastify" {
    interface FastifyRequest {
        user?: {
            sub: string;
            scope?: string;
            [key: string]: any;
        };
    }
    interface Session {
        userId?: string;
    }
}
