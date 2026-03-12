import { FeedRepository } from "./src/modules/feed/feed.repository.js";

async function run() {
    const repo = new FeedRepository();
    console.log("Fetching page 1...");
    const posts1 = await repo.getHashtagFeed("gaming", 10);
    console.log(`Page 1 returned ${posts1.length} posts`);
    if(posts1.length > 0) {
        const lastPost = posts1[posts1.length - 1] as any;
        const cursor1 = lastPost ? (lastPost.publishedAt || lastPost.createdAt)?.toISOString() : null;
        console.log(`Next cursor: ${cursor1}`);
        
        console.log("Fetching page 2...");
        const posts2 = await repo.getHashtagFeed("gaming", 10, cursor1);
        console.log(`Page 2 returned ${posts2.length} posts`);
        
        for (const p of posts2) {
            console.log(`- ID: ${p.id}`);
        }
    }
    process.exit(0);
}
run();
