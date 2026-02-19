import { Pool } from "pg";
export declare const db: import("drizzle-orm/node-postgres").NodePgDatabase<Record<string, never>> & {
    $client: Pool;
};
export declare function testDbConnection(): Promise<void>;
//# sourceMappingURL=drizzle.d.ts.map