import { z } from "zod";
export declare const trackEventSchema: z.ZodObject<{
    postId: z.ZodString;
    action: z.ZodEnum<{
        LIKE: "LIKE";
        VIEW: "VIEW";
        SHARE: "SHARE";
        SAVE: "SAVE";
        NOT_INTERESTED: "NOT_INTERESTED";
    }>;
    duration: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export type TrackEventInput = z.infer<typeof trackEventSchema>;
export declare const getFeedSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    cursor: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type GetFeedInput = z.infer<typeof getFeedSchema>;
//# sourceMappingURL=recommendation.schema.d.ts.map