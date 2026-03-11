import { db } from "../config/drizzle.js";
import {
    users,
    posts,
    comments,
    moderationReports,
    moderationQueue,
} from "../db/schema.js";
import { sql, eq } from "drizzle-orm";

const REASONS = [
    "This post contains hate speech against a specific group.",
    "User is spamming the same link multiple times.",
    "This comment is harassing other users in the thread.",
    "Inappropriate content that violates community standards.",
    "This user is impersonating a well-known person.",
    "Misinformation about public health and safety.",
    "Self-harm or violence promotion.",
    "Graphic content that should be age-restricted.",
    "Fraudulent activity or scam links.",
    "Copyright infringement."
];

const CATEGORIES = ["SPAM", "HARASSMENT", "HATE_SPEECH", "INAPPROPRIATE", "CHILD_SAFETY", "OTHER"] as const;

async function seed() {
    console.log("🧹 Cleaning existing moderation data...\n");

    await db.delete(moderationQueue);
    console.log("  ✓ Cleared moderation_queue");

    await db.delete(moderationReports);
    console.log("  ✓ Cleared moderation_reports");

    console.log("\n✅ Moderation data cleaned!\n");

    // ─── Get existing entities ──────────────────────────────────────────
    const allUsers = await db.select({ id: users.id, username: users.username, role: users.role }).from(users);
    const allPosts = await db.select({ id: posts.id }).from(posts).limit(20);
    const allComments = await db.select({ id: comments.id }).from(comments).limit(20);

    if (allUsers.length === 0) {
        console.error("❌ No users found! Create users or run seed-posts first.");
        process.exit(1);
    }

    const moderators = allUsers.filter(u => u.role === "MODERATOR" || u.role === "ADMIN" || u.role === "SUPER_ADMIN");
    const normalUsers = allUsers.filter(u => u.role === "USER");

    console.log(`👥 Found ${allUsers.length} users (${moderators.length} moderators).`);
    console.log(`📝 Found ${allPosts.length} posts and ${allComments.length} comments.\n`);

    // ─── Seed moderation reports ───────────────────────────────────────
    console.log("🚓 Seeding moderation reports...\n");

    // We'll seed about 15 reports
    for (let i = 0; i < 15; i++) {
        const reporterIdx = Math.floor(Math.random() * allUsers.length);
        const reporter = allUsers[reporterIdx];

        // Pick a target (Post, Comment, or User)
        const typeRoll = Math.random();
        let target: { postId?: string; commentId?: string; targetUserId?: string } = {};

        if (typeRoll < 0.4 && allPosts.length > 0) {
            target.postId = allPosts[Math.floor(Math.random() * allPosts.length)].id;
        } else if (typeRoll < 0.7 && allComments.length > 0) {
            target.commentId = allComments[Math.floor(Math.random() * allComments.length)].id;
        } else {
            // Report a user
            const targetUserIdx = Math.floor(Math.random() * allUsers.length);
            // Avoid reporting self
            if (allUsers[targetUserIdx].id !== reporter.id) {
                target.targetUserId = allUsers[targetUserIdx].id;
            } else {
                // If self, fallback to a post if possible
                if (allPosts.length > 0) {
                    target.postId = allPosts[0].id;
                } else {
                    continue; // Skip this one
                }
            }
        }

        const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
        const reason = REASONS[Math.floor(Math.random() * REASONS.length)];
        const priorityScore = Math.floor(Math.random() * 101); // 0-100

        // Status distribution: 70% PENDING, 20% RESOLVED, 10% DISMISSED
        const statusRoll = Math.random();
        let status: "PENDING" | "RESOLVED" | "DISMISSED" = "PENDING";
        if (statusRoll > 0.9) status = "DISMISSED";
        else if (statusRoll > 0.7) status = "RESOLVED";

        const createdAt = new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)); // Within last 7 days

        const [report] = await db.insert(moderationReports).values({
            reporterId: reporter.id,
            ...target,
            category,
            reason,
            status,
            priorityScore,
            createdAt,
            updatedAt: createdAt
        }).returning();

        if (status === "PENDING" && report) {
            // Assign to queue
            const assignedRoll = Math.random();
            let assignedToId: string | null = null;
            if (assignedRoll > 0.6 && moderators.length > 0) {
                assignedToId = moderators[Math.floor(Math.random() * moderators.length)].id;
            }

            await db.insert(moderationQueue).values({
                reportId: report.id,
                assignedToId,
                priority: priorityScore,
                createdAt: report.createdAt,
                updatedAt: report.updatedAt
            });
        }
    }

    console.log("🎉 Successfully seeded moderation reports and queue!\n");
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
