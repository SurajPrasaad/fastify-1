import { FeedRepository } from "./src/modules/feed/feed.repository.js";
import { db } from "./src/config/drizzle.js";
import { posts, users, postHashtags, hashtags } from "./src/db/schema.js";
import { eq, or, sql, desc, lt, and } from "drizzle-orm";

async function run() {
    const cursorStr = "2026-02-24T00:43:20.428Z";
    const tagWithoutHash = "gaming";
    const tagWithHash = "#gaming";
    
    const query = db.select({ id: posts.id })
            .from(posts)
            .innerJoin(users, eq(posts.userId, users.id))
            .leftJoin(postHashtags, eq(posts.id, postHashtags.postId))
            .leftJoin(hashtags, eq(postHashtags.hashtagId, hashtags.id))
            .where(
                and(
                    eq(posts.status, 'PUBLISHED'),
                    or(
                        eq(hashtags.name, tagWithoutHash),
                        eq(hashtags.name, tagWithHash),
                        sql`${posts.tags} ? ${tagWithoutHash}`,
                        sql`${posts.tags} ? ${tagWithHash}`,
                        sql`${posts.content} ILIKE ${'%' + tagWithHash + '%'}`
                    ),
                    lt(sql`COALESCE(${posts.publishedAt}, ${posts.createdAt})`, new Date(cursorStr))
                )
            )
            .orderBy(desc(sql`COALESCE(${posts.publishedAt}, ${posts.createdAt})`))
            .limit(10);
            
    // console.log(query.toSQL());
    const res = await query;
    console.log("Returned:", res);
    
    // Check actual timestamp of that post in DB!
    const single = await db.select({
        ca: posts.createdAt,
        pa: posts.publishedAt,
        coal: sql`COALESCE(${posts.publishedAt}, ${posts.createdAt})`
    }).from(posts).where(eq(posts.id, res[0]?.id || "39645dc3-03d1-4557-b943-f67f2a55b19a"));
    
    console.log("DB Timestamps:", single);

    process.exit(0);
}
run();
