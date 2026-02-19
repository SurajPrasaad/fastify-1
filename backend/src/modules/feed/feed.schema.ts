
import { z } from "zod";

export const getFeedSchema = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().min(1).max(50).default(20),
});

export const getHashtagFeedSchema = z.object({
    tag: z.string().min(1),
    cursor: z.string().optional(),
    limit: z.coerce.number().min(1).max(50).default(20),
});

export const getExploreFeedSchema = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().min(1).max(50).default(20),
});

export type GetFeedInput = z.infer<typeof getFeedSchema>;
export type GetHashtagFeedInput = z.infer<typeof getHashtagFeedSchema>;
