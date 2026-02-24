import { db } from "./src/config/drizzle.js";
import { posts, comments } from "./src/db/schema.js";
import { count, eq } from "drizzle-orm";

async function check() {
    const allPosts = await db.select().from(posts).limit(5);
    console.log("Posts found:", allPosts.length);

    for (const post of allPosts) {
        const commentCount = await db.select({ value: count() }).from(comments).where(eq(comments.postId, post.id));
        console.log(`Post ${post.id} (Content: ${post.content.substring(0, 20)}...) has ${commentCount[0].value} comments`);
    }
    process.exit(0);
}

check().catch(console.error);
