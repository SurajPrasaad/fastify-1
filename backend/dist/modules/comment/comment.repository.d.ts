import type { CreateCommentDto } from "./comment.dto.js";
export declare class CommentRepository {
    create(userId: string, data: CreateCommentDto): Promise<any>;
    findByPostId(postId: string, limit: number, cursor?: string, parentId?: string): Promise<{
        id: string;
        content: string;
        likesCount: number;
        createdAt: Date;
        updatedAt: Date;
        parentId: string | null;
        user: {
            id: string;
            username: string;
            name: string;
        };
    }[]>;
}
//# sourceMappingURL=comment.repository.d.ts.map