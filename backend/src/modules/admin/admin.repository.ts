import { db } from "../../config/drizzle.js";
import {
    adminAuditLogsExtended,
    posts,
    users,
    comments,
    moderationReports,
    moderationQueue,
    engagementCounters,
    sessions,
    auditLogs,
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
                    avatarUrl: users.avatarUrl,
                },
                likes: posts.likesCount,
                comments: posts.commentsCount,
                shares: posts.repostsCount,
                mediaUrls: posts.mediaUrls,
                visibility: posts.visibility,
                reportsCount: sql<number>`(SELECT count(*) FROM moderation_reports WHERE post_id = ${posts.id})`,
                priorityScore: sql<number>`COALESCE((SELECT avg(priority_score) FROM moderation_reports WHERE post_id = ${posts.id}), 0)`,
                reportBreakdown: sql<Record<string, number>>`
                    COALESCE(
                        (SELECT jsonb_object_agg(category, count)
                         FROM (
                            SELECT category, count(*) as count
                            FROM moderation_reports
                            WHERE post_id = ${posts.id}
                            GROUP BY category
                         ) s
                        ), '{}'::jsonb
                    )`
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

    /**
     * Dashboard-wide analytics for the admin executive view.
     *
     * This aggregates a small set of lightweight metrics that can be safely
     * refreshed frequently from the dashboard without putting heavy load
     * on the database.
     *
     * The optional timeRangeHours parameter controls the sliding window used
     * for short-term metrics (DAU, new signups, API requests, etc.).
     */
    async getDashboardStats(timeRangeHours: number = 24) {
        const now = new Date();
        const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000);
        const daysAgo = (days: number) => hoursAgo(days * 24);

        const rangeStart = hoursAgo(timeRangeHours);
        const monthAgo = daysAgo(30);
        const weekAgo = daysAgo(7);

        const [
            // Core KPIs
            [userTotals],
            [newSignupsRow],
            [dauRow],
            [mauRow],
            [activeReportsRow],
            [apiRequestsRow],
            // Distributions
            reportCategoryRows,
            audienceActiveRows,
            newUserRows,
            [engagementRow],
            [queueRow],
            // Geo distribution for potential map/region views
            byRegion,
            // SLA-style view based on how many reports are resolved
            [slaRow],
        ] = await Promise.all([
            db.select({
                totalUsers: count(users.id),
            }).from(users),

            db.select({
                newSignups24h: count(users.id),
            }).from(users).where(gte(users.createdAt, rangeStart)),

            db.select({
                dau: sql<number>`COUNT(DISTINCT ${sessions.userId})`,
            })
                .from(sessions)
                .where(and(eq(sessions.isValid, true), gte(sessions.lastActiveAt, rangeStart))),

            db.select({
                mau: sql<number>`COUNT(DISTINCT ${sessions.userId})`,
            })
                .from(sessions)
                .where(and(eq(sessions.isValid, true), gte(sessions.lastActiveAt, monthAgo))),

            db.select({
                activeReports: count(moderationReports.id),
            })
                .from(moderationReports)
                .where(eq(moderationReports.status, "PENDING")),

            db.select({
                apiRequests24h: count(auditLogs.id),
            })
                .from(auditLogs)
                .where(gte(auditLogs.createdAt, rangeStart)),

            db.select({
                category: moderationReports.category,
                count: count(moderationReports.id),
            })
                .from(moderationReports)
                .groupBy(moderationReports.category),

            db.select({
                day: sql<string>`DATE_TRUNC('day', ${sessions.lastActiveAt})`.as("day"),
                activeUsers: sql<number>`COUNT(DISTINCT ${sessions.userId})`.as("active_users"),
            })
                .from(sessions)
                .where(and(eq(sessions.isValid, true), gte(sessions.lastActiveAt, weekAgo)))
                .groupBy(sql`DATE_TRUNC('day', ${sessions.lastActiveAt})`)
                .orderBy(asc(sql`DATE_TRUNC('day', ${sessions.lastActiveAt})`)),

            db.select({
                day: sql<string>`DATE_TRUNC('day', ${users.createdAt})`.as("day"),
                newUsers: sql<number>`COUNT(${users.id})`.as("new_users"),
            })
                .from(users)
                .where(gte(users.createdAt, weekAgo))
                .groupBy(sql`DATE_TRUNC('day', ${users.createdAt})`)
                .orderBy(asc(sql`DATE_TRUNC('day', ${users.createdAt})`)),

            db.select({
                likes: sql<number>`COALESCE(SUM(${engagementCounters.likesCount}), 0)`,
                comments: sql<number>`COALESCE(SUM(${engagementCounters.commentsCount}), 0)`,
                reposts: sql<number>`COALESCE(SUM(${engagementCounters.repostsCount}), 0)`,
            }).from(engagementCounters),

            db.select({
                total: count(moderationQueue.id),
            }).from(moderationQueue),

            this.getPostStatsByRegion(),

            db.select({
                total: count(moderationReports.id),
                resolved: sql<number>`SUM(CASE WHEN ${moderationReports.status} = 'PENDING' THEN 0 ELSE 1 END)`,
            }).from(moderationReports),
        ]);

        const totalUsers = Number(userTotals?.totalUsers ?? 0);
        const dau = Number(dauRow?.dau ?? 0);
        const mau = Number(mauRow?.mau ?? 0);
        const newSignups24h = Number(newSignupsRow?.newSignups24h ?? 0);
        const activeReports = Number(activeReportsRow?.activeReports ?? 0);
        const apiRequests24h = Number(apiRequestsRow?.apiRequests24h ?? 0);

        const resolved = Number(slaRow?.resolved ?? 0);
        const totalReports = Number(slaRow?.total ?? 0);
        const slaCompliance =
            totalReports > 0 ? Math.round((resolved / totalReports) * 10_000) / 100 : 100;

        const queueSize = Number(queueRow?.total ?? 0);
        const queueStatus =
            queueSize > 1000 ? "CRITICAL" : queueSize > 250 ? "ELEVATED" : "HEALTHY";

        const engagement = {
            likes: Number(engagementRow?.likes ?? 0),
            comments: Number(engagementRow?.comments ?? 0),
            reposts: Number(engagementRow?.reposts ?? 0),
        };

        // Merge audience activity + new users into a single timeseries
        type AudiencePoint = { date: string; activeUsers: number; newUsers: number };
        const growthMap = new Map<string, AudiencePoint>();

        for (const row of audienceActiveRows) {
            const dateKey = String((row as any).day).slice(0, 10);
            const existing = growthMap.get(dateKey) ?? {
                date: dateKey,
                activeUsers: 0,
                newUsers: 0,
            };
            existing.activeUsers = Number((row as any).activeUsers ?? 0);
            growthMap.set(dateKey, existing);
        }

        for (const row of newUserRows) {
            const dateKey = String((row as any).day).slice(0, 10);
            const existing = growthMap.get(dateKey) ?? {
                date: dateKey,
                activeUsers: 0,
                newUsers: 0,
            };
            existing.newUsers = Number((row as any).newUsers ?? 0);
            growthMap.set(dateKey, existing);
        }

        const audienceGrowth = Array.from(growthMap.values()).sort((a, b) =>
            a.date.localeCompare(b.date),
        );

        const reportCategories = reportCategoryRows.map((row) => ({
            category: row.category,
            count: Number(row.count ?? 0),
        }));

        return {
            kpis: {
                totalUsers,
                dau,
                mau,
                newSignups24h,
                activeReports,
                apiRequests24h,
                slaCompliance,
                uptimePercent: 99.99,
            },
            audienceGrowth,
            engagement,
            reportCategories,
            platformHealth: {
                queueSize,
                queueStatus,
            },
            byRegion,
        };
    }
    async getUserAuditLogs(userId: string, limit: number = 50) {
        return await db.select()
            .from(auditLogs)
            .where(eq(auditLogs.userId, userId))
            .orderBy(desc(auditLogs.createdAt))
            .limit(limit);
    }
}
