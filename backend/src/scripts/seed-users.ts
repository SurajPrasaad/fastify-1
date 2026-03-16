import { db } from "../config/drizzle.js";
import { users, userCounters, userPrivacy } from "../db/schema.js";
import bcrypt from "bcrypt";

async function seed() {
    console.log("👥 Seeding users...");

    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
        console.log("  ✓ Users already exist, skipping user creation.");
        return;
    }

    const hashedPassword = await bcrypt.hash("password123", 10);

    const userData = [
        {
            username: "admin",
            email: "admin@yopmail.com",
            name: "Admin User",
            role: "SUPER_ADMIN" as const,
            password: hashedPassword,
        },
        {
            username: "moderator",
            email: "mod@yopmail.com",
            name: "Moderator User",
            role: "MODERATOR" as const,
            password: hashedPassword,
        },
        {
            username: "suraj",
            email: "suraj@yopmail.com",
            name: "Suraj Prasaad",
            role: "USER" as const,
            password: hashedPassword,
        },
        {
            username: "alice",
            email: "alice@yopmail.com",
            name: "Alice Smith",
            role: "USER" as const,
            password: hashedPassword,
        },
        {
            username: "bob",
            email: "bob@yopmail.com",
            name: "Bob Jones",
            role: "USER" as const,
            password: hashedPassword,
        }
    ];

    for (const u of userData) {
        const [user] = await db.insert(users).values(u).returning();
        if (user) {
            await db.insert(userCounters).values({ userId: user.id });
            await db.insert(userPrivacy).values({ userId: user.id });
            console.log(`  ✓ Created user: ${user.username}`);
        }
    }

    console.log("✅ Users seeded successfully!\n");
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
