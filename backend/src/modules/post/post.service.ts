/**
 * Post Service — Pre-Moderation Publishing Model
 * 
 * Key changes from direct publishing:
 * 1. createPost → status = PENDING_REVIEW (NOT PUBLISHED)
 * 2. Only DRAFT status allows direct editing
 * 3. Hashtags/mentions only processed after PUBLISH
 * 4. Feed queries enforce WHERE status = 'PUBLISHED'
 * 5. Kafka events emitted for lifecycle transitions
 */

import type { PostRepository } from "./post.repository.js";
import type { CreatePostInput, UpdatePostInput } from "./post.schema.js";
import { AppError } from "../../utils/AppError.js";
import { parseMentions } from "../notification/mention.service.js";
import { triggerMentionNotifications } from "../notification/notification.triggers.js";
import { isEditable, validateTransition, type PostStatus } from "./post.state-machine.js";
import * as events from "../moderation/moderation.events.js";
import * as moderationQueue from "../moderation/moderation.queue.js";
import { getOrSetWithLock } from "../../utils/cache.js";
import { redis } from "../../config/redis.js";

export class PostService {
    constructor(private postRepository: PostRepository) { }

    private extractHashtags(content: string): string[] {
        const hashtags = content.match(/#(\w+)/g);
        if (!hashtags) return [];
        return [...new Set(hashtags.map(t => t.slice(1).toLowerCase()))];
    }

    /**
     * Create a new post.
     * - If isDraft = true → status = DRAFT (not in moderation queue)
     * - Otherwise → status = PENDING_REVIEW (enters moderation queue)
     * - Posts are NEVER directly published by users
     */
    async createPost(userId: string, data: CreatePostInput & { isDraft?: boolean, media?: any[] }) {
        const { media: mediaData, ...postData } = data;

        // Pre-moderation: posts start as PENDING_REVIEW unless explicitly saved as draft
        const status: PostStatus = data.isDraft ? "DRAFT" : "PENDING_REVIEW";

        const post = await this.postRepository.create({ ...postData, userId, status });

        if (!post) {
            throw new AppError("Failed to create post", 500);
        }

        // Save media metadata if provided
        if (mediaData && mediaData.length > 0) {
            await this.postRepository.saveMediaMetadata(post.id, userId, mediaData);
        }

        // If submitted for review, add to moderation queue and emit events
        if (status === "PENDING_REVIEW") {
            // Add to Redis priority queue
            moderationQueue.enqueue(post.id, {
                authorId: userId,
                category: "NEW_POST",
                riskScore: 0, // AI scoring would update this asynchronously
                reportCount: 0,
                contentPreview: data.content?.substring(0, 200) || "",
            }).catch(err => console.error("Failed to enqueue post:", err));

            // Emit Kafka events
            events.emitPostCreated(post.id, userId, { content: data.content?.substring(0, 200) });
            events.emitPostSubmittedForReview(post.id, userId);
        }

        return post;
    }

    /**
     * Submit a draft for review.
     * DRAFT → PENDING_REVIEW
     */
    async submitForReview(postId: string, userId: string) {
        const post = await this.postRepository.findById(postId);
        if (!post) throw new AppError("Post not found", 404);
        if (post.userId !== userId) throw new AppError("Unauthorized", 403);

        // Validate state transition
        const transition = validateTransition(
            post.status as PostStatus,
            "SUBMIT",
            "USER",
            true
        );

        if (!transition.valid) {
            throw new AppError(transition.error || "Cannot submit this post for review", 400);
        }

        const updated = await this.postRepository.updateStatus(postId, userId, "PENDING_REVIEW");

        // Add to moderation queue
        moderationQueue.enqueue(postId, {
            authorId: userId,
            category: "SUBMITTED",
            riskScore: 0,
            reportCount: 0,
            contentPreview: post.content?.substring(0, 200) || "",
        }).catch(err => console.error("Failed to enqueue post:", err));

        // Emit events
        events.emitPostSubmittedForReview(postId, userId);

        return updated;
    }

    /**
     * Publish a draft (legacy endpoint — now submits for review instead).
     * In pre-moderation model, "publish" means "submit for review".
     */
    async publishDraft(postId: string, userId: string) {
        return this.submitForReview(postId, userId);
    }

    /**
     * Get the public feed.
     * CRITICAL: Only returns posts with status = 'PUBLISHED'.
     */
    async getFeed(limit: number, cursor?: string, userId?: string, filters?: {
        authorUsername?: string | undefined;
        authorId?: string | undefined;
        tag?: string | undefined;
        includeDeleted?: boolean;
    }) {
        return this.postRepository.findMany(limit, cursor, userId, filters);
    }

    /**
     * Get a specific post.
     * Security: only owner or moderator/admin can see non-published posts.
     */
    async getPost(id: string, userId?: string) {
        const cacheKey = `post:hydrated:${id}`;

        // 1. Fetch base post data (Locked for Stampede protection)
        const post = await getOrSetWithLock(
            cacheKey,
            async () => {
                const p = await this.postRepository.findByIdHydrated(id);
                if (!p) return null;
                return p;
            },
            300 // 5 minutes cache for post data
        ) as any;

        if (!post) throw new AppError("Post not found", 404);

        // 2. Security Check (Owner/Admin only for non-published)
        const nonPublicStatuses: PostStatus[] = [
            "DRAFT", "PENDING_REVIEW", "REJECTED", "NEEDS_REVISION", "REMOVED"
        ];

        if (nonPublicStatuses.includes(post.status) && post.userId !== userId) {
            throw new AppError("Post not found", 404);
        }

        // 3. User-Specific Overlay (Personalized flags)
        // Note: In a real app, you might want to overlay isLiked/isBookmarked here 
        // if they were removed from the cached 'post' object.
        // For now, findByIdHydrated returns them as false if no currentUserId passed to cache builder.

        return post;
    }

    /**
     * Update a post.
     * Only allowed for DRAFT, NEEDS_REVISION, or REJECTED posts (by the owner).
     */
    async updatePost(id: string, userId: string, data: UpdatePostInput) {
        const post = await this.postRepository.findById(id);
        if (!post) throw new AppError("Post not found", 404);
        if (post.userId !== userId) throw new AppError("Unauthorized", 403);

        // Only editable in specific states
        if (!isEditable(post.status as PostStatus)) {
            throw new AppError(
                `Cannot edit post with status '${post.status}'. Post can only be edited when in DRAFT, NEEDS_REVISION, or REJECTED state.`,
                400
            );
        }

        const updated = await this.postRepository.update(id, userId, data);
        if (!updated) {
            throw new AppError("Post not found or unauthorized", 404);
        }

        // Invalidate cache
        const cacheKey = `post:hydrated:${id}`;
        await redis.del(cacheKey);

        return updated;
    }

    /**
     * Resubmit a post after revision/rejection.
     * NEEDS_REVISION → PENDING_REVIEW or REJECTED → PENDING_REVIEW
     */
    async resubmitPost(postId: string, userId: string, data?: UpdatePostInput) {
        const post = await this.postRepository.findById(postId);
        if (!post) throw new AppError("Post not found", 404);
        if (post.userId !== userId) throw new AppError("Unauthorized", 403);

        // Validate transition
        const transition = validateTransition(
            post.status as PostStatus,
            "RESUBMIT",
            "USER",
            true
        );

        if (!transition.valid) {
            throw new AppError(transition.error || "Cannot resubmit this post", 400);
        }

        // Update content if provided
        if (data) {
            await this.postRepository.update(postId, userId, data);
        }

        // Move to pending review
        const updated = await this.postRepository.updateStatus(postId, userId, "PENDING_REVIEW");

        // Re-enqueue
        moderationQueue.enqueue(postId, {
            authorId: userId,
            category: "RESUBMITTED",
            riskScore: 0,
            reportCount: 0,
            contentPreview: (data?.content || post.content)?.substring(0, 200) || "",
        }).catch(err => console.error("Failed to enqueue resubmitted post:", err));

        events.emitPostSubmittedForReview(postId, userId);

        return updated;
    }

    /**
     * Get user's own posts (all statuses visible to owner).
     */
    async getUserPosts(userId: string, limit: number = 20, cursor?: string) {
        return this.postRepository.findMany(limit, cursor, userId, {
            authorId: userId,
            includeDeleted: false, // Don't show hard-deleted
        });
    }

    /**
     * Archive a published post.
     * PUBLISHED → ARCHIVED
     */
    async archivePost(id: string, userId: string) {
        const archived = await this.postRepository.archive(id, userId);
        if (!archived) {
            throw new AppError("Post not found or unauthorized", 404);
        }
        return archived;
    }

    /**
     * Delete own post (soft delete).
     */
    async deletePost(id: string, userId: string) {
        const deleted = await this.postRepository.delete(id, userId);
        if (!deleted) {
            throw new AppError("Post not found or unauthorized", 404);
        }
    }

    /**
     * Vote on a poll.
     */
    async votePoll(userId: string, postId: string, optionId: string) {
        const post = await this.postRepository.findById(postId);
        if (!post) {
            throw new AppError("Post not found", 404);
        }

        // Only allow voting on published posts
        if (post.status !== "PUBLISHED") {
            throw new AppError("Cannot vote on a post that is not published", 400);
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

    /**
     * Process post after moderation approval (called by moderation service).
     * Handles hashtag linking, mention notifications, etc.
     */
    async onPostPublished(postId: string, userId: string) {
        const post = await this.postRepository.findById(postId, true);
        if (!post) return;

        // Link hashtags
        const hashtags = this.extractHashtags(post.content);
        this.postRepository.linkHashtags(post.id, hashtags).catch(err => {
            console.error("Failed to link hashtags:", err);
        });

        // Process mentions
        const { validUsers } = await parseMentions(post.content, userId);
        if (validUsers.length > 0) {
            const mentionIds = validUsers.map(u => u.id);
            this.postRepository.linkMentions(post.id, mentionIds).catch(err => {
                console.error("Failed to link mentions:", err);
            });
            triggerMentionNotifications(userId, post.content, post.id);
        }

        // Emit published event
        events.emitPostPublished(postId, userId);
    }
}
