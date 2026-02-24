
import { db } from "../../config/drizzle.js";
import { posts, users, postVersions, hashtags, postHashtags, media, polls, pollOptions, pollVotes } from "../../db/schema.js";
import { and, desc, eq, lt, sql, count } from "drizzle-orm";
import type { CreatePostInput, UpdatePostInput } from "./post.schema.js";

export class PostRepository {
    async create(data: CreatePostInput & { userId: string; status?: "DRAFT" | "PUBLISHED" }) {
        const status = data.status || 'PUBLISHED';

        return await db.transaction(async (tx) => {
            let pollId: string | null = null;

            // 1. Create poll if exists
            if (data.poll) {
                const [newPoll] = await tx.insert(polls).values({
                    question: data.content.slice(0, 255), // Use part of content as internal question
                    expiresAt: data.poll.expiresAt,
                }).returning();

                if (!newPoll) {
                    throw new Error("Failed to create poll");
                }

                pollId = newPoll.id;

                // Create poll options
                await tx.insert(pollOptions).values(
                    data.poll.options.map(opt => ({
                        pollId: newPoll.id,
                        text: opt
                    }))
                );
            }

            // 2. Create post
            const [post] = await tx
                .insert(posts)
                .values({
                    userId: data.userId,
                    content: data.content,
                    codeSnippet: data.codeSnippet || null,
                    language: data.language || null,
                    mediaUrls: data.mediaUrls || [],
                    location: data.location || null,
                    pollId: pollId,
                    status: status,
                    publishedAt: status === 'PUBLISHED' ? new Date() : null,
                })
                .returning();

            if (!post) {
                throw new Error("Failed to create post");
            }

            return await this.findByIdHydrated(post.id, undefined, tx);
        });
    }

    async findByIdHydrated(id: string, currentUserId?: string, tx?: any) {
        // const client = tx || db;
        const [item] = await tx
            .select({
                id: posts.id,
                userId: posts.userId,
                content: posts.content,
                codeSnippet: posts.codeSnippet,
                language: posts.language,
                mediaUrls: posts.mediaUrls,
                location: posts.location,
                pollId: posts.pollId,
                originalPostId: posts.originalPostId,
                status: posts.status,
                commentsCount: posts.commentsCount,
                likesCount: posts.likesCount,
                publishedAt: posts.publishedAt,
                createdAt: posts.createdAt,
                updatedAt: posts.updatedAt,
                author: {
                    username: users.username,
                    name: users.name,
                    avatarUrl: users.avatarUrl,
                },
                isLiked: currentUserId
                    ? sql<boolean>`EXISTS (SELECT 1 FROM likes WHERE target_id = ${posts.id} AND user_id = ${currentUserId} AND target_type = 'POST')`
                    : sql<boolean>`false`,
                isBookmarked: currentUserId
                    ? sql<boolean>`EXISTS (SELECT 1 FROM bookmarks WHERE post_id = ${posts.id} AND user_id = ${currentUserId})`
                    : sql<boolean>`false`,
            })
            .from(posts)
            .innerJoin(users, eq(posts.userId, users.id))
            .where(eq(posts.id, id))
            .limit(1);

        if (!item) return null;
        const client = tx || db;

        let poll = null;
        let originalPost = null;

        // 1. Fetch Poll
        if (item.pollId) {
            const [pollData] = await client.select().from(polls).where(eq(polls.id, item.pollId));
            if (pollData) {
                const options = await client.select().from(pollOptions).where(eq(pollOptions.pollId, item.pollId));
                let userVotedOptionId = null;
                if (currentUserId) {
                    const [vote] = await client.select()
                        .from(pollVotes)
                        .where(and(eq(pollVotes.pollId, item.pollId), eq(pollVotes.userId, currentUserId)));
                    userVotedOptionId = vote?.optionId || null;
                }
                poll = { ...pollData, options, userVotedOptionId };
            }
        }

        // 2. Fetch Original Post
        if (item.originalPostId) {
            const [orig] = await client
                .select({
                    id: posts.id,
                    content: posts.content,
                    createdAt: posts.createdAt,
                    author: {
                        username: users.username,
                        name: users.name,
                        avatarUrl: users.avatarUrl,
                    }
                })
                .from(posts)
                .innerJoin(users, eq(posts.userId, users.id))
                .where(eq(posts.id, item.originalPostId))
                .limit(1);

            originalPost = orig || null;
        }

        return {
            ...item,
            poll,
            originalPost
        };
    }


    async findById(id: string, includePrivate = false) {
        const query = db
            .select()
            .from(posts)
            .where(eq(posts.id, id));

        const [post] = await query;
        if (!post) return null;

        // Soft delete check
        if (post.status === 'DELETED') return null;

        // Draft check
        if (post.status === 'DRAFT' && !includePrivate) return null;

        return post;
    }

    async findMany(limit: number, cursor?: string, currentUserId?: string, filters?: { authorUsername?: string | undefined, authorId?: string | undefined }) {
        const conditions = [eq(posts.status, 'PUBLISHED')];

        if (filters?.authorId) {
            conditions.push(eq(posts.userId, filters.authorId));
        }

        if (filters?.authorUsername) {
            conditions.push(eq(users.username, filters.authorUsername));
        }

        if (cursor) {
            conditions.push(lt(posts.publishedAt, new Date(cursor)));
        }

        const items = await db
            .select({
                id: posts.id,
                userId: posts.userId,
                content: posts.content,
                codeSnippet: posts.codeSnippet,
                language: posts.language,
                mediaUrls: posts.mediaUrls,
                location: posts.location,
                pollId: posts.pollId,
                originalPostId: posts.originalPostId,
                status: posts.status,
                commentsCount: posts.commentsCount,
                likesCount: posts.likesCount,
                publishedAt: posts.publishedAt,
                createdAt: posts.createdAt,
                updatedAt: posts.updatedAt,
                author: {
                    username: users.username,
                    name: users.name,
                    avatarUrl: users.avatarUrl,
                },
                isLiked: currentUserId
                    ? sql<boolean>`EXISTS (SELECT 1 FROM likes WHERE target_id = ${posts.id} AND user_id = ${currentUserId} AND target_type = 'POST')`
                    : sql<boolean>`false`,
                isBookmarked: currentUserId
                    ? sql<boolean>`EXISTS (SELECT 1 FROM bookmarks WHERE post_id = ${posts.id} AND user_id = ${currentUserId})`
                    : sql<boolean>`false`,
            })
            .from(posts)
            .innerJoin(users, eq(posts.userId, users.id))
            .where(and(...conditions))
            .orderBy(desc(posts.publishedAt))
            .limit(limit + 1);

        // Fetch additional data (polls and original posts)
        const hydratedPosts = await Promise.all(items.map(async (item) => {
            let poll = null;
            let originalPost = null;

            // 1. Fetch Poll if exists
            if (item.pollId) {
                const [pollData] = await db.select().from(polls).where(eq(polls.id, item.pollId));
                if (pollData) {
                    const options = await db.select().from(pollOptions).where(eq(pollOptions.pollId, item.pollId));
                    let userVotedOptionId = null;
                    if (currentUserId) {
                        const [vote] = await db.select()
                            .from(pollVotes)
                            .where(and(eq(pollVotes.pollId, item.pollId), eq(pollVotes.userId, currentUserId)));
                        userVotedOptionId = vote?.optionId || null;
                    }
                    poll = { ...pollData, options, userVotedOptionId };
                }
            }

            // 2. Fetch Original Post if it's a repost
            if (item.originalPostId) {
                // We fetch a simple version of the original post to avoid deep recursion
                // but include author info for UI
                const [orig] = await db
                    .select({
                        id: posts.id,
                        content: posts.content,
                        createdAt: posts.createdAt,
                        author: {
                            username: users.username,
                            name: users.name,
                            avatarUrl: users.avatarUrl,
                        }
                    })
                    .from(posts)
                    .innerJoin(users, eq(posts.userId, users.id))
                    .where(eq(posts.id, item.originalPostId))
                    .limit(1);

                originalPost = orig || null;
            }

            return {
                ...item,
                poll,
                originalPost
            };
        }));

        return hydratedPosts;
    }


    async update(id: string, userId: string, data: UpdatePostInput) {
        return await db.transaction(async (tx) => {
            // 1. Get current post for versioning
            const [current] = await tx
                .select()
                .from(posts)
                .where(and(eq(posts.id, id), eq(posts.userId, userId)))
                .limit(1);

            if (!current) return null;

            // 2. Save version
            const [vCount] = await tx
                .select({ count: count() })
                .from(postVersions)
                .where(eq(postVersions.postId, id));

            await tx.insert(postVersions).values({
                postId: id,
                content: current.content,
                codeSnippet: current.codeSnippet,
                language: current.language,
                mediaUrls: current.mediaUrls,
                version: (Number(vCount?.count) || 0) + 1,
            });

            // 3. Update post
            const [updated] = await tx
                .update(posts)
                .set({
                    ...data,
                    updatedAt: new Date(),
                })
                .where(and(eq(posts.id, id), eq(posts.userId, userId)))
                .returning();

            if (!updated) {
                throw new Error("Failed to update post");
            }

            return updated;
        });
    }

    async publish(id: string, userId: string) {
        const [published] = await db
            .update(posts)
            .set({
                status: 'PUBLISHED',
                publishedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(posts.id, id),
                    eq(posts.userId, userId),
                    eq(posts.status, 'DRAFT')
                )
            )
            .returning();
        if (!published) {
            throw new Error("Failed to publish post");
        }
        return published;
    }

    async archive(id: string, userId: string) {
        const [archived] = await db
            .update(posts)
            .set({
                status: 'ARCHIVED',
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(posts.id, id),
                    eq(posts.userId, userId)
                )
            )
            .returning();
        if (!archived) {
            throw new Error("Failed to archive post");
        }
        return archived;
    }

    async delete(id: string, userId: string) {
        const [deleted] = await db
            .update(posts)
            .set({
                status: 'DELETED',
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(posts.id, id),
                    eq(posts.userId, userId)
                )
            )
            .returning();
        if (!deleted) {
            throw new Error("Failed to delete post");
        }
        return deleted;
    }

    async saveMediaMetadata(postId: string, userId: string, mediaData: any[]) {
        const values = mediaData.map(m => ({
            userId,
            postId,
            publicId: m.publicId,
            secureUrl: m.secureUrl,
            resourceType: m.resourceType as "image" | "video" | "audio",
            format: m.format,
            width: m.width,
            height: m.height,
            duration: m.duration,
            bytes: m.bytes,
            status: "PROCESSED" as const,
        }));

        if (values.length > 0) {
            await db.insert(media).values(values);
        }
    }

    async linkHashtags(postId: string, hashtagNames: string[]) {
        if (hashtagNames.length === 0) return;

        await db.transaction(async (tx) => {
            for (const name of hashtagNames) {
                // Upsert hashtag
                const [hashtag] = await tx
                    .insert(hashtags)
                    .values({ name, postsCount: 1 })
                    .onConflictDoUpdate({
                        target: hashtags.name,
                        set: {
                            postsCount: sql`${hashtags.postsCount} + 1`,
                            lastUsedAt: new Date()
                        }
                    })
                    .returning();

                // Link to post
                if (hashtag) {
                    await tx.insert(postHashtags).values({
                        postId,
                        hashtagId: hashtag.id
                    }).onConflictDoNothing();
                }
            }
        });
    }

    async vote(userId: string, pollId: string, optionId: string) {
        return await db.transaction(async (tx) => {
            // Check if already voted (enforced by PK anyway, but let's be explicit)
            const [existing] = await tx
                .select()
                .from(pollVotes)
                .where(and(eq(pollVotes.pollId, pollId), eq(pollVotes.userId, userId)))
                .limit(1);

            if (existing) return null;

            // 1. Record vote
            await tx.insert(pollVotes).values({
                userId,
                pollId,
                optionId,
            });

            // 2. Increment count
            await tx
                .update(pollOptions)
                .set({
                    votesCount: sql`${pollOptions.votesCount} + 1`,
                })
                .where(eq(pollOptions.id, optionId));

            return true;
        });
    }
}

