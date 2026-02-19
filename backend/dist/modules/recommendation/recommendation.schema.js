import { z } from "zod";
export const trackEventSchema = z.object({
    postId: z.string().uuid(),
    action: z.enum(["VIEW", "LIKE", "SHARE", "SAVE", "NOT_INTERESTED"]),
    duration: z.number().int().nonnegative().optional().default(0), // Duration in seconds
});
export const getFeedSchema = z.object({
    limit: z.coerce.number().int().min(1).max(50).default(20),
    cursor: z.string().optional(),
});
//# sourceMappingURL=recommendation.schema.js.map