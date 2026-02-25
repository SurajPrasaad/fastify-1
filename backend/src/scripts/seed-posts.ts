import { db } from "../config/drizzle.js";
import {
    posts,
    comments,
    likes,
    reactions,
    reposts,
    bookmarks,
    hashtags,
    postHashtags,
    postVersions,
    media,
    engagementCounters,
    notifications,
    users,
} from "../db/schema.js";
import { sql, eq } from "drizzle-orm";

// ─── Categories & Tags ───────────────────────────────────────────────────────

const HASHTAGS = [
    "javascript", "typescript", "react", "nextjs", "nodejs",
    "ai", "machinelearning", "deeplearning", "chatgpt", "llm",
    "webdev", "frontend", "backend", "fullstack", "devops",
    "design", "uidesign", "uxdesign", "figma", "tailwindcss",
    "startup", "saas", "indiehacker", "productlaunch", "buildinpublic",
    "gaming", "gamedev", "esports", "unity", "unreal",
    "news", "technews", "breakingnews",
    "sports", "fitness", "running",
    "music", "hiphop", "producer",
    "crypto", "web3", "blockchain",
];

// ─── 30 Diverse, Realistic Posts ─────────────────────────────────────────────

const SEED_POSTS: {
    content: string;
    tags: string[];
    category: string;
    likesCount: number;
    commentsCount: number;
    repostsCount: number;
    hoursAgo: number;
}[] = [
        // ── AI & Machine Learning (6 posts) ──
        {
            content: "Just spent the weekend fine-tuning a local LLM on my company's docs. The results are mind-blowing — it answers domain-specific questions better than GPT-4 now. Open source wins again. 🧠\n\n#ai #llm #machinelearning",
            tags: ["ai", "llm", "machinelearning"],
            category: "ai",
            likesCount: 342, commentsCount: 28, repostsCount: 45,
            hoursAgo: 2,
        },
        {
            content: "The new Claude model is absolutely insane for code generation. I gave it a 200-line spec and it produced a working Fastify backend with Drizzle ORM in one shot. We're living in the future.\n\n#ai #chatgpt #coding",
            tags: ["ai", "chatgpt", "fullstack"],
            category: "ai",
            likesCount: 891, commentsCount: 67, repostsCount: 120,
            hoursAgo: 5,
        },
        {
            content: "Hot take: RAG is not dead, it's just misunderstood.\n\nMost teams fail because they:\n1. Don't chunk documents properly\n2. Use basic cosine similarity\n3. Skip reranking\n4. Ignore metadata filtering\n\nFix these and RAG becomes extremely powerful.\n\n#ai #deeplearning",
            tags: ["ai", "deeplearning", "llm"],
            category: "ai",
            likesCount: 1523, commentsCount: 94, repostsCount: 210,
            hoursAgo: 8,
        },
        {
            content: "Trained a custom image classifier using TensorFlow.js that runs entirely in the browser. No server needed. The model is only 2MB. Privacy-first AI is the future.\n\n#ai #machinelearning #webdev",
            tags: ["ai", "machinelearning", "webdev"],
            category: "ai",
            likesCount: 456, commentsCount: 31, repostsCount: 58,
            hoursAgo: 12,
        },
        {
            content: "OpenAI just announced GPT-5 and it's multimodal from day one. Vision, audio, code execution, and tool use all built in. The API pricing is surprisingly reasonable too.\n\n#ai #chatgpt #technews",
            tags: ["ai", "chatgpt", "technews"],
            category: "ai",
            likesCount: 2341, commentsCount: 182, repostsCount: 567,
            hoursAgo: 1,
        },
        {
            content: "Unpopular opinion: Most companies don't need AI. They need better data pipelines and cleaner databases. AI on garbage data = garbage decisions.\n\n#ai #data #startup",
            tags: ["ai", "startup", "buildinpublic"],
            category: "ai",
            likesCount: 678, commentsCount: 89, repostsCount: 134,
            hoursAgo: 16,
        },

        // ── Tech & Engineering (6 posts) ──
        {
            content: "Migrated our entire monolith to microservices over 6 months. Result? 3x deployment speed, 10x better scaling, but also 5x more meetings. Trade-offs everywhere. 😅\n\n#devops #backend #engineering",
            tags: ["devops", "backend", "fullstack"],
            category: "tech",
            likesCount: 234, commentsCount: 42, repostsCount: 31,
            hoursAgo: 3,
        },
        {
            content: "TypeScript 6.0 just dropped and the new pattern matching syntax is chef's kiss 🤌\n\n```typescript\nmatch (response) {\n  { status: 200, data } => handleSuccess(data),\n  { status: 404 } => handleNotFound(),\n  { status: 500, error } => handleError(error),\n}\n```\n\n#typescript #javascript #webdev",
            tags: ["typescript", "javascript", "webdev"],
            category: "tech",
            likesCount: 1876, commentsCount: 156, repostsCount: 312,
            hoursAgo: 6,
        },
        {
            content: "Next.js 15 Server Actions completely changed how I think about forms. No API routes, no useState for loading states. Just write a function and it works.\n\nThe DX improvement is massive.\n\n#nextjs #react #frontend",
            tags: ["nextjs", "react", "frontend"],
            category: "tech",
            likesCount: 567, commentsCount: 45, repostsCount: 78,
            hoursAgo: 10,
        },
        {
            content: "PSA: If you're still not using Bun in production, you're missing out on:\n\n• 4x faster npm installs\n• Native TypeScript execution\n• Built-in test runner\n• SQLite out of the box\n• Insanely fast HTTP server\n\nThe ecosystem is ready. Make the switch.\n\n#nodejs #javascript #webdev",
            tags: ["nodejs", "javascript", "webdev"],
            category: "tech",
            likesCount: 789, commentsCount: 63, repostsCount: 95,
            hoursAgo: 14,
        },
        {
            content: "Postgres is the most underrated database in 2026.\n\nIt does:\n✅ Relational (obviously)\n✅ JSON/JSONB (better than MongoDB)\n✅ Full-text search (decent alternative to Elasticsearch)\n✅ Vector search (pgvector)\n✅ Time-series (TimescaleDB)\n✅ Graph queries (Apache AGE)\n\nOne database to rule them all.\n\n#backend #database #devops",
            tags: ["backend", "devops", "fullstack"],
            category: "tech",
            likesCount: 2134, commentsCount: 178, repostsCount: 345,
            hoursAgo: 20,
        },
        {
            content: "Just discovered htmx and it's genuinely changing my perspective on web development. Not everything needs to be a React SPA. Sometimes a sprinkle of interactivity is all you need.\n\n#webdev #frontend #javascript",
            tags: ["webdev", "frontend", "javascript"],
            category: "tech",
            likesCount: 345, commentsCount: 52, repostsCount: 41,
            hoursAgo: 24,
        },

        // ── Design (4 posts) ──
        {
            content: "Redesigned our entire checkout flow and conversion went up 34%. The secret? We removed 3 form fields and added a progress bar. Less is truly more in UX design.\n\n#design #uxdesign #startup",
            tags: ["design", "uxdesign", "startup"],
            category: "design",
            likesCount: 456, commentsCount: 34, repostsCount: 67,
            hoursAgo: 4,
        },
        {
            content: "Figma's new AI features are incredible. Auto-layout suggestions, smart color palette generation, and accessibility checker built right in. Design tools are entering a new era.\n\n#figma #design #uidesign",
            tags: ["figma", "design", "uidesign"],
            category: "design",
            likesCount: 723, commentsCount: 48, repostsCount: 89,
            hoursAgo: 9,
        },
        {
            content: "Stop using gray backgrounds for everything.\n\nTry:\n• Subtle gradients\n• Warm neutrals (cream, sand)\n• Glass morphism with blur\n• Mesh gradients for hero sections\n• Dark mode with deep navy instead of pure black\n\nYour users will feel the difference.\n\n#design #uidesign #tailwindcss",
            tags: ["design", "uidesign", "tailwindcss"],
            category: "design",
            likesCount: 1234, commentsCount: 72, repostsCount: 189,
            hoursAgo: 15,
        },
        {
            content: "Just shipped a complete design system with 120+ components, dark mode support, and full accessibility coverage. Open sourcing it next week. Stay tuned! 🎨\n\n#design #uidesign #figma",
            tags: ["design", "uidesign", "figma"],
            category: "design",
            likesCount: 567, commentsCount: 41, repostsCount: 98,
            hoursAgo: 22,
        },

        // ── Startups & Business (4 posts) ──
        {
            content: "Month 8 of building in public:\n\n📊 MRR: $12,400\n👥 Users: 2,100\n📈 Growth: 23% MoM\n💰 Runway: 14 months\n🔥 Churn: 3.2%\n\nThe SaaS grind is real but the compounding effect is magical. Keep shipping.\n\n#buildinpublic #saas #startup",
            tags: ["buildinpublic", "saas", "startup"],
            category: "startups",
            likesCount: 890, commentsCount: 76, repostsCount: 134,
            hoursAgo: 7,
        },
        {
            content: "Raised our seed round — $2.5M from amazing investors who actually understand developer tools. No vanity metrics, no BS growth hacking. Just building something developers actually need.\n\n#startup #productlaunch #indiehacker",
            tags: ["startup", "productlaunch", "indiehacker"],
            category: "startups",
            likesCount: 1456, commentsCount: 112, repostsCount: 234,
            hoursAgo: 11,
        },
        {
            content: "Best startup advice I received: 'Talk to 50 potential customers before writing a single line of code.' I ignored it for my first startup. It failed. I followed it for my second. It's doing $50K MRR now.\n\n#startup #saas #buildinpublic",
            tags: ["startup", "saas", "buildinpublic"],
            category: "startups",
            likesCount: 2567, commentsCount: 198, repostsCount: 456,
            hoursAgo: 18,
        },
        {
            content: "Just launched on Product Hunt! 🚀\n\nWe built an AI-powered code review tool that catches bugs before they reach production. 6 months of work, late nights, and way too much coffee.\n\nWould love your support! Link in bio.\n\n#productlaunch #startup #ai",
            tags: ["productlaunch", "startup", "ai"],
            category: "startups",
            likesCount: 678, commentsCount: 54, repostsCount: 89,
            hoursAgo: 26,
        },

        // ── Gaming (3 posts) ──
        {
            content: "The new Unreal Engine 6 demo is photorealistic. I genuinely couldn't tell if it was a game or a movie. Ray tracing, Nanite, and MetaHuman have all gotten massive upgrades.\n\n#gaming #gamedev #unreal",
            tags: ["gaming", "gamedev", "unreal"],
            category: "gaming",
            likesCount: 1234, commentsCount: 87, repostsCount: 156,
            hoursAgo: 13,
        },
        {
            content: "Started learning game dev with Godot and I'm amazed by how beginner-friendly it is compared to Unity. Made a complete platformer in a weekend. The GDScript language is so intuitive.\n\n#gamedev #gaming #coding",
            tags: ["gamedev", "gaming"],
            category: "gaming",
            likesCount: 345, commentsCount: 29, repostsCount: 42,
            hoursAgo: 19,
        },
        {
            content: "Esports viewership just surpassed traditional sports among 18-24 year olds for the first time ever. The future of entertainment is interactive. 🎮\n\n#esports #gaming #news",
            tags: ["esports", "gaming", "technews"],
            category: "gaming",
            likesCount: 890, commentsCount: 67, repostsCount: 123,
            hoursAgo: 30,
        },

        // ── News & Trends (3 posts) ──
        {
            content: "Breaking: EU passes the AI Safety Act requiring all AI models above 10B parameters to undergo safety audits. This will reshape how companies deploy AI in Europe.\n\n#technews #ai #breakingnews",
            tags: ["technews", "ai", "breakingnews"],
            category: "news",
            likesCount: 3456, commentsCount: 234, repostsCount: 567,
            hoursAgo: 1,
        },
        {
            content: "GitHub just crossed 200 million repositories. Think about that — 200M projects, ideas, and dreams stored in one platform. The scale of global collaboration is breathtaking.\n\n#technews #webdev #coding",
            tags: ["technews", "webdev"],
            category: "news",
            likesCount: 1567, commentsCount: 89, repostsCount: 234,
            hoursAgo: 17,
        },
        {
            content: "Apple announces M5 chip with dedicated Neural Engine 2.0. 40% faster ML inference, 18-hour battery life, and native support for running 70B parameter models locally. The on-device AI era is here.\n\n#technews #ai #news",
            tags: ["technews", "ai"],
            category: "news",
            likesCount: 4567, commentsCount: 345, repostsCount: 890,
            hoursAgo: 4,
        },

        // ── Sports & Fitness (2 posts) ──
        {
            content: "Ran my first marathon today! 4 hours 12 minutes. Not the fastest, but crossing that finish line made me cry happy tears. If I can do it, anyone can. Start small, stay consistent. 🏃‍♂️\n\n#running #fitness #sports",
            tags: ["running", "fitness", "sports"],
            category: "sports",
            likesCount: 567, commentsCount: 89, repostsCount: 34,
            hoursAgo: 8,
        },
        {
            content: "The intersection of tech and sports is getting wild:\n• AI referee systems\n• Real-time performance analytics\n• VR training simulations\n• Biometric wearables\n• Computer vision for tactical analysis\n\nSports tech is a $30B industry now.\n\n#sports #ai #technews",
            tags: ["sports", "ai", "technews"],
            category: "sports",
            likesCount: 234, commentsCount: 21, repostsCount: 45,
            hoursAgo: 28,
        },

        // ── Music (2 posts) ──
        {
            content: "Just finished producing my first EP using AI-assisted mixing. Used Suno for initial ideas and then refined everything manually. The future of music production is human + AI collaboration, not replacement.\n\n#music #ai #producer",
            tags: ["music", "ai", "producer"],
            category: "music",
            likesCount: 345, commentsCount: 28, repostsCount: 56,
            hoursAgo: 21,
        },
        {
            content: "Released a lo-fi beats playlist with 50 tracks — all original compositions made with Ableton and a $200 MIDI controller. Proof that expensive gear isn't required to make great music. 🎵\n\n#music #hiphop #producer",
            tags: ["music", "hiphop", "producer"],
            category: "music",
            likesCount: 456, commentsCount: 34, repostsCount: 67,
            hoursAgo: 36,
        },
    ];

// ─── Helper Functions ────────────────────────────────────────────────────────

function randomDate(hoursAgo: number): Date {
    const now = new Date();
    // Add some randomness (±30 minutes)
    const jitter = Math.floor(Math.random() * 60 - 30) * 60 * 1000;
    return new Date(now.getTime() - hoursAgo * 60 * 60 * 1000 + jitter);
}

// ─── Main Seed Function ──────────────────────────────────────────────────────

async function seed() {
    console.log("🧹 Cleaning existing post-related data...\n");

    // Delete in correct FK order (children first)
    await db.delete(bookmarks);
    console.log("  ✓ Cleared bookmarks");

    await db.delete(reposts);
    console.log("  ✓ Cleared reposts");

    await db.delete(reactions);
    console.log("  ✓ Cleared reactions");

    await db.delete(likes);
    console.log("  ✓ Cleared likes");

    await db.delete(engagementCounters);
    console.log("  ✓ Cleared engagement_counters");

    // Clear notifications that reference posts
    await db.execute(sql`DELETE FROM notifications WHERE post_id IS NOT NULL`);
    console.log("  ✓ Cleared post notifications");

    await db.delete(comments);
    console.log("  ✓ Cleared comments");

    await db.delete(postHashtags);
    console.log("  ✓ Cleared post_hashtags");

    await db.delete(media);
    console.log("  ✓ Cleared media");

    await db.delete(postVersions);
    console.log("  ✓ Cleared post_versions");

    await db.delete(posts);
    console.log("  ✓ Cleared posts");

    await db.delete(hashtags);
    console.log("  ✓ Cleared hashtags");

    console.log("\n✅ All post-related data cleaned!\n");

    // ─── Get existing users ──────────────────────────────────────────────
    const existingUsers = await db.select({ id: users.id, username: users.username, name: users.name }).from(users);

    if (existingUsers.length === 0) {
        console.error("❌ No users found! Create at least one user first.");
        process.exit(1);
    }

    console.log(`👥 Found ${existingUsers.length} users to assign posts to.\n`);

    // ─── Create hashtags ─────────────────────────────────────────────────
    console.log("🏷️  Seeding hashtags...");

    const hashtagMap: Record<string, string> = {};

    for (const name of HASHTAGS) {
        const [inserted] = await db
            .insert(hashtags)
            .values({
                name,
                postsCount: 0,
                lastUsedAt: new Date(),
            })
            .returning();

        if (inserted) {
            hashtagMap[name] = inserted.id;
        }
    }

    console.log(`  ✓ Created ${Object.keys(hashtagMap).length} hashtags\n`);

    // ─── Seed posts ──────────────────────────────────────────────────────
    console.log("📝 Seeding 30 posts...\n");

    let totalPosts = 0;

    for (const seedPost of SEED_POSTS) {
        // Distribute posts across users (round-robin with some randomness)
        const userIdx = Math.floor(Math.random() * existingUsers.length);
        const user = existingUsers[userIdx];

        const publishedAt = randomDate(seedPost.hoursAgo);

        const [newPost] = await db.insert(posts).values({
            userId: user.id,
            content: seedPost.content,
            tags: seedPost.tags,
            status: "PUBLISHED",
            likesCount: seedPost.likesCount,
            commentsCount: seedPost.commentsCount,
            repostsCount: seedPost.repostsCount,
            publishedAt,
            createdAt: publishedAt,
            updatedAt: publishedAt,
        }).returning();

        if (!newPost) continue;

        // Link hashtags
        for (const tag of seedPost.tags) {
            const hashtagId = hashtagMap[tag];
            if (hashtagId) {
                await db.insert(postHashtags).values({
                    postId: newPost.id,
                    hashtagId,
                }).onConflictDoNothing();

                // Update hashtag counts
                await db
                    .update(hashtags)
                    .set({
                        postsCount: sql`${hashtags.postsCount} + 1`,
                        lastUsedAt: publishedAt,
                    })
                    .where(eq(hashtags.id, hashtagId));
            }
        }

        // Create engagement counter
        await db.insert(engagementCounters).values({
            targetId: newPost.id,
            targetType: "POST",
            likesCount: seedPost.likesCount,
            commentsCount: seedPost.commentsCount,
            repostsCount: seedPost.repostsCount,
        }).onConflictDoNothing();

        totalPosts++;
        const categoryEmojis: Record<string, string> = {
            ai: "🤖", tech: "💻", design: "🎨", startups: "🚀",
            gaming: "🎮", news: "📰", sports: "⚽", music: "🎵",
        };
        const emoji = categoryEmojis[seedPost.category] || "📝";
        console.log(
            `  ${emoji} [${seedPost.category.toUpperCase().padEnd(8)}] "${seedPost.content.substring(0, 60).replace(/\n/g, " ")}..." → @${user.username}`
        );
    }

    console.log(`\n🎉 Successfully seeded ${totalPosts} posts across ${existingUsers.length} users!`);
    console.log(`📊 Created ${Object.keys(hashtagMap).length} hashtags with post associations.\n`);

    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
