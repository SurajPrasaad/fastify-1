import { api } from "@/lib/api-client";

export const postService = {
    /**
     * Create a new post or draft
     */
    async createPost(data: any): Promise<any> {
        return api.post("/posts", data);
    },

    /**
     * Fetch a paginated feed of posts
     */
    async getPosts(cursor?: string, limit: number = 10, filters?: { authorUsername?: string, authorId?: string }) {
        const query = new URLSearchParams();
        if (cursor) query.set("cursor", cursor);
        query.set("limit", limit.toString());
        if (filters?.authorUsername) query.set("authorUsername", filters.authorUsername);
        if (filters?.authorId) query.set("authorId", filters.authorId);

        return api.get(`/posts?${query.toString()}`);
    },

    /**
     * Get a single post by ID
     */
    async getPost(id: string) {
        return api.get(`/posts/${id}`);
    },

    /**
     * Update an existing post (e.g., editing content)
     */
    async updatePost(id: string, data: any) {
        return api.put(`/posts/${id}`, data);
    },

    /**
     * Delete a post
     */
    async deletePost(id: string) {
        return api.delete(`/posts/${id}`);
    },

    /**
     * Archive a post (move to ARCHIVED status)
     */
    async archivePost(id: string) {
        return api.put(`/posts/${id}/archive`, {});
    },

    /**
     * Publish a draft post
     */
    async publishDraft(id: string) {
        return api.post(`/posts/${id}/publish`, {});
    },

    /**
     * Get trending hashtags (if implemented on backend)
     */
    async getTrendingHashtags() {
        return api.get("/posts/trending/hashtags");
    },

    /**
     * Vote on a poll
     */
    async votePoll(pollId: string, optionId: string) {
        return api.post(`/posts/polls/${pollId}/vote`, { optionId });
    }
};
