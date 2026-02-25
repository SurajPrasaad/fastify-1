import { z } from "zod";

export const FeedTypeEnum = z.enum(["FOR_YOU", "FOLLOWING"]);

export const getFeedSchema = z.object({
    type: FeedTypeEnum.default("FOR_YOU"),
    cursor: z.string().optional(),
    limit: z.coerce.number().min(1).max(50).default(20),
});

export const getHashtagParamsSchema = z.object({
    tag: z.string().min(1),
});

export const getHashtagFeedSchema = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().min(1).max(50).default(20),
});

export const getExploreFeedSchema = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().min(1).max(50).default(20),
});

export type GetFeedInput = z.infer<typeof getFeedSchema>;
export type GetHashtagFeedInput = z.infer<typeof getHashtagFeedSchema>;
export type FeedType = z.infer<typeof FeedTypeEnum>;
