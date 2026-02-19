import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/fastify_app",
});
export const db = drizzle(pool);
export async function testDbConnection() {
    try {
        await pool.query('SELECT 1');
        console.log('✅ PostgreSQL connected');
    }
    catch (err) {
        console.error('❌ PostgreSQL connection error:', err);
        throw err;
    }
}
//# sourceMappingURL=drizzle.js.map