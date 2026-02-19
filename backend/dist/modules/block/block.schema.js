import { z } from "zod";
export const blockParamsSchema = z.object({
    id: z.string().uuid(),
});
export const blockResponseSchema = z.object({
    success: z.boolean(),
});
export const blockUserRouteSchema = {
    description: "Block a user",
    tags: ["Social"],
    params: blockParamsSchema,
    response: {
        200: blockResponseSchema,
    },
};
export const unblockUserRouteSchema = {
    description: "Unblock a user",
    tags: ["Social"],
    params: blockParamsSchema,
    response: {
        200: blockResponseSchema,
    },
};
//# sourceMappingURL=block.schema.js.map