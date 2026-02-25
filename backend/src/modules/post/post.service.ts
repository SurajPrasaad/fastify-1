import type { PostRepository } from "./post.repository.js";
import type { CreatePostInput, UpdatePostInput } from "./post.schema.js";
import { AppError } from "../../utils/AppError.js";
import { parseMentions } from "../notification/mention.service.js";
import { triggerMentionNotifications } from "../notification/notification.triggers.js";

export class PostService {
    constructor(private postRepository: PostRepository) { }

    private extractHashtags(content: string): string[] {
        const hashtags = content.match(/#(\w+)/g);
        if (!hashtags) return [];
        return [...new Set(hashtags.map(t => t.slice(1).toLowerCase()))];
    }

    async createPost(userId: string, data: CreatePostInput & { isDraft?: boolean, media?: any[] }) {
        const { media: mediaData, ...postData } = data;
        const status = data.isDraft ? "DRAFT" : "PUBLISHED";

        const post = await this.postRepository.create({ ...postData, userId, status });

        if (!post) {
            throw new AppError("Failed to create post", 500);
        }

        // 1. If high-fidelity media metadata is provided, save it to the media table
        if (mediaData && mediaData.length > 0) {
            await this.postRepository.saveMediaMetadata(post.id, userId, mediaData);
        }

        // 2. Link hashtags asynchronously
        if (status === "PUBLISHED") {
            const hashtags = this.extractHashtags(data.content);
            this.postRepository.linkHashtags(post.id, hashtags).catch(err => {
                console.error("Failed to link hashtags:", err);
            });

            // 3. Process Mentions
            const { validUsers } = await parseMentions(data.content, userId);
            if (validUsers.length > 0) {
                const mentionIds = validUsers.map(u => u.id);
                // Link in DB
                this.postRepository.linkMentions(post.id, mentionIds).catch(err => {
                    console.error("Failed to link mentions:", err);
                });

                // Trigger Notifications
                triggerMentionNotifications(userId, data.content, post.id);
            }
        }

        return post;
    }

    async publishDraft(postId: string, userId: string) {
        const post = await this.postRepository.publish(postId, userId);
        if (!post) {
            throw new AppError("Draft not found or unauthorized", 404);
        }

        // Link hashtags on publish
        const hashtags = this.extractHashtags(post.content);
        this.postRepository.linkHashtags(post.id, hashtags).catch(err => {
            console.error("Failed to link hashtags on publish:", err);
        });

        // 3. Process Mentions
        const { validUsers } = await parseMentions(post.content, userId);
        if (validUsers.length > 0) {
            const mentionIds = validUsers.map(u => u.id);
            this.postRepository.linkMentions(post.id, mentionIds).catch(err => {
                console.error("Failed to link mentions on publish:", err);
            });
            triggerMentionNotifications(userId, post.content, post.id);
        }

        return post;
    }

    async getFeed(limit: number, cursor?: string, userId?: string, filters?: { authorUsername?: string | undefined, authorId?: string | undefined }) {
        return this.postRepository.findMany(limit, cursor, userId, filters);
    }

    async getPost(id: string, userId?: string) {
        const post = await this.postRepository.findById(id, true);
        if (!post) throw new AppError("Post not found", 404);

        // Security check for drafts
        if (post.status === "DRAFT" && post.userId !== userId) {
            throw new AppError("Unauthorized access to draft", 403);
        }

        return post;
    }

    async updatePost(id: string, userId: string, data: UpdatePostInput) {
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

            // Re-process Mentions
            const { validUsers } = await parseMentions(updated.content, userId);
            if (validUsers.length > 0) {
                const mentionIds = validUsers.map(u => u.id);
                this.postRepository.linkMentions(updated.id, mentionIds).catch(err => {
                    console.error("Failed to update mentions:", err);
                });
                // Note: triggerMentionNotifications handles deduplication internally or we can add it there if needed.
                triggerMentionNotifications(userId, updated.content, updated.id);
            }
        }

        return updated;
    }

    async archivePost(id: string, userId: string) {
        const archived = await this.postRepository.archive(id, userId);
        if (!archived) {
            throw new AppError("Post not found or unauthorized", 404);
        }
        return archived;
    }

    async deletePost(id: string, userId: string) {
        const deleted = await this.postRepository.delete(id, userId);
        if (!deleted) {
            throw new AppError("Post not found or unauthorized", 404);
        }
    }

    async votePoll(userId: string, postId: string, optionId: string) {
        const post = await this.postRepository.findById(postId);
        if (!post) {
            throw new AppError("Post not found", 404);
        }

        if (!post.pollId) {
            throw new AppError("This post does not have a poll", 400);
        }

        const result = await this.postRepository.vote(userId, post.pollId, optionId);
        if (!result) {
            throw new AppError("You have already voted in this poll or the vote could not be recorded", 400);
        }

        return result;
    }
}
