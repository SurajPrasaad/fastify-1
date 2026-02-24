import { db } from "../config/drizzle.js";
import { auditLogs } from "../db/schema.js";

export async function logActivity(
    userId: string | null,
    action: string,
    ipAddress: string | null,
    status: "SUCCESS" | "FAILURE" = "SUCCESS",
    metadata: any = {}
) {
    try {
        await db.insert(auditLogs).values({
            userId,
            action,
            ipAddress,
            status,
            metadata: metadata || {}
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
}

