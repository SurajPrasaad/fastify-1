import { db } from "../config/drizzle.js";
import { notificationTemplates } from "../db/schema.js";

async function seed() {
    console.log("🌱 Seeding Notification Templates...");

    const templates = [
        {
            slug: "post_liked",
            titleTemplate: "New Like",
            bodyTemplate: "{{actorName}} liked your post",
            isInAppEnabled: true,
            isPushEnabled: true,
            isEmailEnabled: false,
        },
        {
            slug: "new_comment",
            titleTemplate: "New Comment",
            bodyTemplate: '{{actorName}} commented: "{{snippet}}"',
            isInAppEnabled: true,
            isPushEnabled: true,
            isEmailEnabled: true,
        },
        {
            slug: "new_reply",
            titleTemplate: "New Reply",
            bodyTemplate: '{{actorName}} replied to your comment: "{{snippet}}"',
            isInAppEnabled: true,
            isPushEnabled: true,
            isEmailEnabled: false,
        },
        {
            slug: "new_mention",
            titleTemplate: "You were mentioned",
            bodyTemplate: "{{actorName}} mentioned you in a comment",
            isInAppEnabled: true,
            isPushEnabled: true,
            isEmailEnabled: true,
        },
        {
            slug: "new_follower",
            titleTemplate: "New Follower",
            bodyTemplate: "{{actorName}} started following you",
            isInAppEnabled: true,
            isPushEnabled: true,
            isEmailEnabled: true,
        },
        {
            slug: "new_message",
            titleTemplate: "New Message",
            bodyTemplate: "{{actorName}}: {{snippet}}",
            isInAppEnabled: true,
            isPushEnabled: true,
            isEmailEnabled: false,
        },
    ];

    for (const t of templates) {
        await db
            .insert(notificationTemplates)
            .values(t)
            .onConflictDoUpdate({
                target: notificationTemplates.slug,
                set: t,
            });
    }

    console.log("✅ Templates seeded!");
    process.exit(0);
}

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
