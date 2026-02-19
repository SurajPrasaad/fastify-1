import { v2 as cloudinary } from "cloudinary";
import { AppError } from "../../utils/AppError.js";
cloudinary.config({
    cloud_name: process.env.CLO_NAME || '',
    api_key: process.env.CLO_API_KEY || '',
    api_secret: process.env.CLO_API_SECRET || '',
});
export class PostService {
    postRepository;
    constructor(postRepository) {
        this.postRepository = postRepository;
    }
    extractHashtags(content) {
        const hashtags = content.match(/#(\w+)/g);
        if (!hashtags)
            return [];
        return [...new Set(hashtags.map(t => t.slice(1).toLowerCase()))];
    }
    async createPost(userId, data) {
        const status = data.isDraft ? "DRAFT" : "PUBLISHED";
        const post = await this.postRepository.create({ ...data, userId, status });
        if (!post) {
            throw new AppError("Failed to create post", 500);
        }
        // Link hashtags asynchronously
        if (status === "PUBLISHED") {
            const hashtags = this.extractHashtags(data.content);
            this.postRepository.linkHashtags(post.id, hashtags).catch(err => {
                console.error("Failed to link hashtags:", err);
            });
        }
        return post;
    }
    async publishDraft(postId, userId) {
        const post = await this.postRepository.publish(postId, userId);
        if (!post) {
            throw new AppError("Draft not found or unauthorized", 404);
        }
        // Link hashtags on publish
        const hashtags = this.extractHashtags(post.content);
        this.postRepository.linkHashtags(post.id, hashtags).catch(err => {
            console.error("Failed to link hashtags on publish:", err);
        });
        return post;
    }
    async getFeed(limit, cursor) {
        return this.postRepository.findMany(limit, cursor);
    }
    async getPost(id, userId) {
        const post = await this.postRepository.findById(id, true);
        if (!post)
            throw new AppError("Post not found", 404);
        // Security check for drafts
        if (post.status === "DRAFT" && post.userId !== userId) {
            throw new AppError("Unauthorized access to draft", 403);
        }
        return post;
    }
    async updatePost(id, userId, data) {
        const updated = await this.postRepository.update(id, userId, data);
        if (!updated) {
            throw new AppError("Post not found or unauthorized", 404);
        }
        // Re-index hashtags for published posts
        if (updated.status === "PUBLISHED") {
            const hashtags = this.extractHashtags(updated.content);
            this.postRepository.linkHashtags(updated.id, hashtags).catch(err => {
                console.error("Failed to update hashtags:", err);
            });
        }
        return updated;
    }
    async archivePost(id, userId) {
        const archived = await this.postRepository.archive(id, userId);
        if (!archived) {
            throw new AppError("Post not found or unauthorized", 404);
        }
        return archived;
    }
    async deletePost(id, userId) {
        const deleted = await this.postRepository.delete(id, userId);
        if (!deleted) {
            throw new AppError("Post not found or unauthorized", 404);
        }
        return deleted;
    }
    async getUploadSignature() {
        const timestamp = Math.round((new Date()).getTime() / 1000);
        const signature = cloudinary.utils.api_sign_request({
            timestamp: timestamp,
            folder: 'posts'
        }, process.env.CLO_API_SECRET || '');
        return {
            signature,
            timestamp,
            apiKey: process.env.CLO_API_KEY,
            cloudName: process.env.CLO_NAME
        };
    }
}
//# sourceMappingURL=post.service.js.map