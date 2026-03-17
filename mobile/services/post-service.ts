import { api } from "./api-client";

export interface CreatePostDto {
    content: string;
    mediaUrls?: string[];
    poll?: {
        question: string;
        options: string[];
        expiresAt: string;
    };
    location?: string;
    status?: "PUBLISHED" | "DRAFT";
}

export const PostService = {
    async createPost(data: CreatePostDto) {
        return api.post("/posts", data);
    },

    async votePoll(pollId: string, optionId: string) {
        return api.post(`/posts/polls/${pollId}/vote`, { optionId });
    },

    async deletePost(postId: string) {
        return api.delete(`/posts/${postId}`);
    }
};
