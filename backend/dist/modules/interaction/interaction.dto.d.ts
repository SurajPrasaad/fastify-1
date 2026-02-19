import { z } from "zod";
import { resourceTypeSchema, toggleLikeSchema, toggleBookmarkSchema, createCommentSchema, getCommentsSchema, getRepliesSchema } from "./interaction.schema.js";
export type ResourceType = z.infer<typeof resourceTypeSchema>;
export type ToggleLikeInput = z.infer<typeof toggleLikeSchema>;
export type ToggleBookmarkInput = z.infer<typeof toggleBookmarkSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type GetCommentsQuery = z.infer<typeof getCommentsSchema>;
export type GetRepliesQuery = z.infer<typeof getRepliesSchema>;
export interface CommentWithAuthor {
    id: string;
    postId: string;
    parentId: string | null;
    content: string;
    likesCount: number;
    createdAt: Date;
    author: {
        username: string;
        name: string;
    };
}
//# sourceMappingURL=interaction.dto.d.ts.map