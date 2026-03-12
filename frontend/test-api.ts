import { api } from "./src/lib/api-client";

async function run() {
    try {
        const url = "http://localhost:8000/api/feed/hashtag/gaming?limit=10";
        console.log(`Fetching page 1: ${url}`);
        const res = await fetch(url);
        const data = await res.json();
        console.log(`Page 1 returned ${data.data?.length} posts`);
        
        let cursor = data.nextCursor;
        let count = 2;
        while (data.hasMore && cursor) {
            const nextUrl = `http://localhost:8000/api/feed/hashtag/gaming?limit=10&cursor=${encodeURIComponent(cursor)}`;
            console.log(`Fetching page ${count}: ${nextUrl}`);
            const res2 = await fetch(nextUrl);
            const data2 = await res2.json();
            console.log(`Page ${count} returned ${data2.data?.length} posts. nextCursor: ${data2.nextCursor}, hasMore: ${data2.hasMore}`);
            cursor = data2.nextCursor;
            count++;
            if (count > 5) break; 
        }
    } catch(e) { console.error(e) }
    process.exit(0);
}
run();
