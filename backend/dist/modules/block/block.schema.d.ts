import { z } from "zod";
import type { FastifySchema } from "fastify";
export declare const blockParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const blockResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
}, z.core.$strip>;
export declare const blockUserRouteSchema: FastifySchema;
export declare const unblockUserRouteSchema: FastifySchema;
//# sourceMappingURL=block.schema.d.ts.map