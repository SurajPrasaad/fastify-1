import { interactionApi } from "../interaction/api";
import { Comment } from "../interaction/types";

export const commentApi = {
    getPostComments: (postId: string, cursor?: string) => interactionApi.getComments(postId, cursor),
    getCommentReplies: (parentId: string, cursor?: string) => interactionApi.getReplies(parentId, cursor),
    create: (postId: string, content: string, parentId?: string) => interactionApi.createComment({ postId, content, parentId }),
};
