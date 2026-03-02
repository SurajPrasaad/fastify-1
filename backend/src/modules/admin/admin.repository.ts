import { db } from "../../config/drizzle.js";
import {
    adminAuditLogsExtended, posts, users, comments,
    moderationReports, moderationQueue, engagementCounters
} from "../../db/schema.js";
import { and, desc, eq, lt, sql, count, inArray, gte, ilike, asc, or, notInArray } from "drizzle-orm";
import { PostRepository } from "../post/post.repository.js";

const postRepo = new PostRepository();

export class AdminRepository {
    async findManagedPosts(params: {
        limit: number;
        offset: number;
        search?: string;
        status?: string[];
        category?: string;
        riskLevel?: 'CRITICAL' | 'ELEVATED' | 'LOW';
        sortField?: string;
        sortOrder?: 'asc' | 'desc';
    }) {
        let whereClause = [];

        if (params.status && params.status.length > 0) {
            whereClause.push(inArray(posts.status, params.status as any));
        }

        if (params.search) {
            whereClause.push(ilike(posts.content, `%${params.search}%`));
        }

        // Complex risk scoring filter simulation (based on report count/priority)
        if (params.riskLevel) {
            const riskThreshold = params.riskLevel === 'CRITICAL' ? 80 : params.riskLevel === 'ELEVATED' ? 40 : 0;
            const subQuery = db.select({ postId: moderationReports.postId })
                .from(moderationReports)
                .groupBy(moderationReports.postId)
                .having(sql`avg(${moderationReports.priorityScore}) >= ${riskThreshold}`);
            whereClause.push(inArray(posts.id, subQuery));
        }

        const baseQuery = db
            .select({
                id: posts.id,
                content: posts.content,
                status: posts.status,
                createdAt: posts.createdAt,
                author: {
                    username: users.username,
                    name: users.name,
                },
                reportsCount: sql<number>`(SELECT count(*) FROM moderation_reports WHERE post_id = ${posts.id})`,
                priorityScore: sql<number>`COALESCE((SELECT avg(priority_score) FROM moderation_reports WHERE post_id = ${posts.id}), 0)`
            })
            .from(posts)
            .innerJoin(users, eq(posts.userId, users.id))
            .where(and(...whereClause));

        const order = params.sortOrder === 'asc' ? asc : desc;
        const sortField = params.sortField === 'priorityScore' ? sql`priorityScore` : posts.createdAt;

        const results = await baseQuery
            .orderBy(order(sortField))
            .limit(params.limit)
            .offset(params.offset);

        return results;
    }

    async getNextInQueue(currentId: string, filters: any) {
        // Find the next post that matches the current filters but isn't the current one
        // and ideally has higher priority or is next in time
        const posts = await this.findManagedPosts({ ...filters, limit: 1, offset: 1 }); // Simple offset-based next
        return posts[0]?.id || null;
    }

    async moderatePost(data: {
        postId: string;
        action: 'APPROVE' | 'REJECT' | 'NEEDS_REVISION' | 'DELETE' | 'SHADOW_BAN' | 'RESTORE' | 'ESCALATE';
        adminId: string;
        reason: string;
        internalNote?: string | undefined;
    }) {
        return await db.transaction(async (tx) => {
            const [post] = await tx.select().from(posts).where(eq(posts.id, data.postId)).limit(1);
            if (!post) throw new Error("Post not found");

            const statusMap: Record<string, any> = {
                'APPROVE': 'PUBLISHED',
                'REJECT': 'REJECTED',
                'NEEDS_REVISION': 'NEEDS_REVISION',
                'DELETE': 'DELETED',
                'RESTORE': 'PUBLISHED',
                'SHADOW_BAN': 'RESTRICTED',
                'ESCALATE': 'UNDER_REVIEW',
            };

            // 1. Update Post Status if applicable
            if (statusMap[data.action]) {
                const newStatus = statusMap[data.action];
                await tx.update(posts).set({
                    status: newStatus,
                    moderationMetadata: sql`jsonb_set(
                        COALESCE(moderation_metadata, '{}'::jsonb), 
                        '{lastModeratorId}', 
                        to_jsonb(${data.adminId}::text)
                    )`
                }).where(eq(posts.id, data.postId));

                // If approved, trigger publishedAt if null
                if (newStatus === 'PUBLISHED') {
                    await tx.update(posts).set({ publishedAt: new Date() }).where(eq(posts.id, data.postId));
                }
            }

            // 2. Resolve existing reports
            if (data.action !== 'ESCALATE') {
                await tx.update(moderationReports)
                    .set({
                        status: data.action === 'APPROVE' ? 'DISMISSED' : 'RESOLVED',
                        resolution: data.reason,
                        resolvedById: data.adminId,
                        updatedAt: new Date()
                    })
                    .where(eq(moderationReports.postId, data.postId));
            }

            // 3. Log Audit Action & Internal Note
            await tx.insert(adminAuditLogsExtended).values({
                adminId: data.adminId,
                actionType: data.action,
                resourceType: 'POST',
                resourceId: data.postId,
                reason: data.reason,
                previousState: post,
                newState: { ...post, status: statusMap[data.action] || post.status, internalNote: data.internalNote },
            });

            return { success: true, action: data.action };
        });
    }

    async addModeratorNote(postId: string, adminId: string, content: string) {
        return await db.insert(adminAuditLogsExtended).values({
            adminId,
            actionType: 'NOTE_ADD',
            resourceType: 'POST',
            resourceId: postId,
            reason: 'Internal moderator note',
            newState: { note: content },
        });
    }

    async getPostReports(postId: string) {
        return await db.select()
            .from(moderationReports)
            .innerJoin(users, eq(moderationReports.reporterId, users.id))
            .where(eq(moderationReports.postId, postId))
            .orderBy(desc(moderationReports.createdAt));
    }

    async bulkAction(postIds: string[], action: "APPROVE" | "DELETE" | "RESTORE", adminId: string, reason: string) {
        return await db.transaction(async (tx) => {
            const statusMap: Record<string, any> = {
                'APPROVE': 'PUBLISHED',
                'DELETE': 'DELETED',
                'RESTORE': 'PUBLISHED'
            };

            await tx.update(posts).set({ status: statusMap[action] }).where(inArray(posts.id, postIds));

            await tx.insert(adminAuditLogsExtended).values({
                adminId,
                actionType: `BULK_${action}`,
                resourceType: 'POST',
                resourceId: postIds[0]!,
                reason: reason,
                newState: { affectedPostIds: postIds },
            });

            return { affectedCount: postIds.length };
        });
    }

    async getPostStatsByRegion() {
        return await db.select({
            region: posts.geoRestrictions,
            count: count(posts.id),
        }).from(posts).groupBy(posts.geoRestrictions).limit(10);
    }
}
