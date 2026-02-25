
import { z } from "zod";

// ─── Query Schemas ───────────────────────────────────────────────────────────

export const exploreFeedSchema = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    region: z.string().max(20).optional(),
});

export const trendingFeedSchema = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    region: z.string().max(20).optional(),
    timeWindow: z.enum(["1h", "6h", "24h", "7d"]).default("24h"),
});

export const categoryFeedSchema = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const categoryParamsSchema = z.object({
    slug: z.string().min(1).max(100),
});

export const searchSchema = z.object({
    q: z.string().min(1).max(200),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    type: z.enum(["posts", "users", "hashtags"]).default("posts"),
});

export const creatorsSchema = z.object({
    limit: z.coerce.number().int().min(1).max(30).default(10),
    category: z.string().optional(),
});

export const trendingHashtagsSchema = z.object({
    limit: z.coerce.number().int().min(1).max(50).default(20),
    region: z.string().max(20).optional(),
});

export const exploreInteractionSchema = z.object({
    postId: z.string().uuid(),
    action: z.enum(["VIEW", "LIKE", "SHARE", "SAVE", "NOT_INTERESTED"]),
    duration: z.number().int().nonnegative().optional().default(0),
});

// ─── Type Exports ────────────────────────────────────────────────────────────

export type ExploreFeedInput = z.infer<typeof exploreFeedSchema>;
export type TrendingFeedInput = z.infer<typeof trendingFeedSchema>;
export type CategoryFeedInput = z.infer<typeof categoryFeedSchema>;
export type CategoryParams = z.infer<typeof categoryParamsSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type CreatorsInput = z.infer<typeof creatorsSchema>;
export type TrendingHashtagsInput = z.infer<typeof trendingHashtagsSchema>;
export type ExploreInteractionInput = z.infer<typeof exploreInteractionSchema>;
