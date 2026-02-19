import { db } from "../../config/drizzle.js";
import { users } from "../../db/schema.js";
import { inArray, eq } from "drizzle-orm";
import type { MentionParseResult } from "./notification.dto.js";

/**
 * Mention Parsing Service
 * 
 * Production-grade @username extraction with:
 * - Regex-based extraction
 * - DB validation of actual users
 * - Deduplication
 * - XSS sanitization
 * - Rate limiting (max 10 mentions per message)
 */

const MENTION_REGEX = /@([a-zA-Z0-9_]{1,30})/g;
const MAX_MENTIONS_PER_MESSAGE = 10;

/**
 * Extract @username mentions from text content
 */
export function extractMentions(text: string): string[] {
    const matches = text.matchAll(MENTION_REGEX);
    const usernames = new Set<string>();

    for (const match of matches) {
        if (match[1]) {
            usernames.add(match[1].toLowerCase());
        }
    }

    // Rate limit: cap at MAX_MENTIONS_PER_MESSAGE
    return Array.from(usernames).slice(0, MAX_MENTIONS_PER_MESSAGE);
}

/**
 * Validate that mentioned usernames exist in the database
 * Returns only valid user records
 */
export async function validateMentionedUsers(usernames: string[]) {
    if (usernames.length === 0) return [];

    const validUsers = await db
        .select({
            id: users.id,
            username: users.username,
            name: users.name,
            avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(inArray(users.username, usernames));

    return validUsers;
}

/**
 * Sanitize text content to prevent XSS
 */
export function sanitizeContent(text: string): string {
    return text
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/\//g, "&#x2F;");
}

/**
 * Full mention parsing pipeline:
 * 1. Sanitize input
 * 2. Extract @usernames
 * 3. Validate against database
 * 4. Return validated users + sanitized text
 */
export async function parseMentions(
    text: string,
    excludeUserId?: string
): Promise<{
    validUsers: { id: string; username: string; name: string; avatarUrl: string | null }[];
    sanitizedText: string;
    rawMentions: string[];
}> {
    const sanitizedText = sanitizeContent(text);
    const rawMentions = extractMentions(text);

    if (rawMentions.length === 0) {
        return { validUsers: [], sanitizedText, rawMentions: [] };
    }

    const validUsers = await validateMentionedUsers(rawMentions);

    // Filter out self-mentions
    const filteredUsers = excludeUserId
        ? validUsers.filter((u) => u.id !== excludeUserId)
        : validUsers;

    return {
        validUsers: filteredUsers,
        sanitizedText,
        rawMentions,
    };
}
