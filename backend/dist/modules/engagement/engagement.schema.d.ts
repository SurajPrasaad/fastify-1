import { z } from "zod";
export declare const engagementTargetTypeSchema: z.ZodEnum<{
    POST: "POST";
    COMMENT: "COMMENT";
}>;
export declare const reactionTypeSchema: z.ZodEnum<{
    LIKE: "LIKE";
    LOVE: "LOVE";
    HAHA: "HAHA";
    WOW: "WOW";
    SAD: "SAD";
    ANGRY: "ANGRY";
}>;
export declare const toggleLikeSchema: z.ZodObject<{
    targetId: z.ZodString;
    targetType: z.ZodEnum<{
        POST: "POST";
        COMMENT: "COMMENT";
    }>;
}, z.core.$strip>;
export declare const reactSchema: z.ZodObject<{
    targetId: z.ZodString;
    targetType: z.ZodEnum<{
        POST: "POST";
        COMMENT: "COMMENT";
    }>;
    type: z.ZodEnum<{
        LIKE: "LIKE";
        LOVE: "LOVE";
        HAHA: "HAHA";
        WOW: "WOW";
        SAD: "SAD";
        ANGRY: "ANGRY";
    }>;
}, z.core.$strip>;
export declare const repostSchema: z.ZodObject<{
    postId: z.ZodString;
    quoteText: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const engagementCountsSchema: z.ZodObject<{
    targetId: z.ZodString;
    targetType: z.ZodEnum<{
        POST: "POST";
        COMMENT: "COMMENT";
    }>;
    likesCount: z.ZodNumber;
    commentsCount: z.ZodNumber;
    repostsCount: z.ZodNumber;
    reactions: z.ZodRecord<z.ZodEnum<{
        LIKE: "LIKE";
        LOVE: "LOVE";
        HAHA: "HAHA";
        WOW: "WOW";
        SAD: "SAD";
        ANGRY: "ANGRY";
    }>, z.ZodNumber>;
}, z.core.$strip>;
export type ToggleLikeInput = z.infer<typeof toggleLikeSchema>;
export type ReactInput = z.infer<typeof reactSchema>;
export type RepostInput = z.infer<typeof repostSchema>;
//# sourceMappingURL=engagement.schema.d.ts.map