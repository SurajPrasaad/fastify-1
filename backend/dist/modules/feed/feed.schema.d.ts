import { z } from "zod";
export declare const getFeedSchema: z.ZodObject<{
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const getHashtagFeedSchema: z.ZodObject<{
    tag: z.ZodString;
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const getExploreFeedSchema: z.ZodObject<{
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type GetFeedInput = z.infer<typeof getFeedSchema>;
export type GetHashtagFeedInput = z.infer<typeof getHashtagFeedSchema>;
//# sourceMappingURL=feed.schema.d.ts.map