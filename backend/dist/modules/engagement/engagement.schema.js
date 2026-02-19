import { z } from "zod";
export const engagementTargetTypeSchema = z.enum(["POST", "COMMENT"]);
export const reactionTypeSchema = z.enum(["LIKE", "LOVE", "HAHA", "WOW", "SAD", "ANGRY"]);
export const toggleLikeSchema = z.object({
    targetId: z.string().uuid(),
    targetType: engagementTargetTypeSchema,
});
export const reactSchema = z.object({
    targetId: z.string().uuid(),
    targetType: engagementTargetTypeSchema,
    type: reactionTypeSchema,
});
export const repostSchema = z.object({
    postId: z.string().uuid(),
    quoteText: z.string().max(1000).optional(),
});
export const engagementCountsSchema = z.object({
    targetId: z.string().uuid(),
    targetType: engagementTargetTypeSchema,
    likesCount: z.number(),
    commentsCount: z.number(),
    repostsCount: z.number(),
    reactions: z.record(reactionTypeSchema, z.number()),
});
//# sourceMappingURL=engagement.schema.js.map