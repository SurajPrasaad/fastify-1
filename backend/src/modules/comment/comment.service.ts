
import { CommentRepository } from "./comment.repository.js";
import type { CreateCommentDto, GetCommentsDto, CommentResponse } from "./comment.dto.js";
export class CommentService {
    constructor(private commentRepository: CommentRepository) { }

    async createComment(userId: string, data: CreateCommentDto) {
        // Validate Content (Optional additional sanitization here if Zod isn't enough)
        // For now assuming Zod handled basic structure.

        // Create Comment in Transaction
        const comment = await this.commentRepository.create(userId, data);
        return comment;
    }

    async getComments(dto: GetCommentsDto): Promise<CommentResponse> {
        const { postId, limit = 20, cursor, parentId } = dto;

        // Fetch comments (limit + 1 to check for next page)
        const comments = await this.commentRepository.findByPostId(postId, limit, cursor, parentId);

        let nextCursor: string | null = null;

        if (comments.length > limit) {
            // We have more items, so grab the last one from the *requested limit*
            const lastItem = comments[limit - 1];
            if (lastItem) {
                nextCursor = lastItem.createdAt.toISOString();
            }
            comments.pop(); // Remove the extra item
        }

        return {
            comments,
            nextCursor,
        };
    }
}
