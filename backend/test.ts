import { db } from "./src/config/drizzle.js";
import { posts } from "./src/db/schema.js";

async function run() {
    const allPosts = await db.select().from(posts);
    const gamingPosts = allPosts.filter(p => p.content.includes("#gaming"));
    console.log(`Total gaming posts in DB: ${gamingPosts.length}`);
    for (const p of gamingPosts) {
        console.log(`- ID: ${p.id}, Content: ${p.content.substring(0, 50)}...`);
    }
    process.exit(0);
}
run();
