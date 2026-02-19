import { CommentRepository } from "./comment.repository.js";
import type { CreateCommentDto, GetCommentsDto, CommentResponse } from "./comment.dto.js";
export declare class CommentService {
    private commentRepository;
    constructor(commentRepository: CommentRepository);
    createComment(userId: string, data: CreateCommentDto): Promise<any>;
    getComments(dto: GetCommentsDto): Promise<CommentResponse>;
}
//# sourceMappingURL=comment.service.d.ts.map