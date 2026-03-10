
import 'dotenv/config';
import { exploreWarmer } from '../modules/explore/explore.warmer.js';
import { redis } from '../config/redis.js';
import { testDbConnection } from '../config/drizzle.js';

/**
 * Standalone Script to Warm Explore Cache
 * 
 * Can be run manually or as a CronJob to refresh the trending pools
 * even if the server hasn't restarted.
 */
async function main() {
    try {
        console.log("🚀 Starting manual cache warming...");

        // 1. Ensure DB is connected
        await testDbConnection();

        // 2. Force warm
        await exploreWarmer.warm();

        // 3. Cleanup
        await redis.quit();

        console.log("🏁 Cache warming complete.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Fatal error during cache warming:", err);
        process.exit(1);
    }
}

main();
