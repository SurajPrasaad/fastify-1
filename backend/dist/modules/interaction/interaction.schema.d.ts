import { z } from "zod";
export declare const resourceTypeSchema: z.ZodEnum<{
    POST: "POST";
    COMMENT: "COMMENT";
}>;
export declare const toggleLikeSchema: z.ZodObject<{
    resourceId: z.ZodString;
    resourceType: z.ZodEnum<{
        POST: "POST";
        COMMENT: "COMMENT";
    }>;
}, z.core.$strip>;
export declare const toggleBookmarkSchema: z.ZodObject<{
    postId: z.ZodString;
}, z.core.$strip>;
export declare const createCommentSchema: z.ZodObject<{
    postId: z.ZodString;
    parentId: z.ZodOptional<z.ZodString>;
    content: z.ZodString;
}, z.core.$strip>;
export declare const getCommentsSchema: z.ZodObject<{
    postId: z.ZodString;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    cursor: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const getRepliesSchema: z.ZodObject<{
    parentId: z.ZodString;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    cursor: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
//# sourceMappingURL=interaction.schema.d.ts.map