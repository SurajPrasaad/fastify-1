import { pgTable, text, timestamp, uuid, jsonb, integer, primaryKey, index, unique, boolean, varchar } from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';
export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    username: text("username").notNull().unique(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    password: text("password"),
    isEmailVerified: boolean("is_email_verified").default(false).notNull(),
    tokenVersion: integer("token_version").default(1).notNull(),
    status: text("status").$type().default("ACTIVE").notNull(),
    regionAffinity: varchar("region_affinity", { length: 20 }), // For multi-region routing
    techStack: jsonb("tech_stack").$type().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
// Sharded counters to avoid hot partition issues in the main users table
export const userCounters = pgTable("user_counters", {
    userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    followersCount: integer("followers_count").default(0).notNull(),
    followingCount: integer("following_count").default(0).notNull(),
    postsCount: integer("posts_count").default(0).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const userPrivacy = pgTable("user_privacy", {
    userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    profileVisibility: text("profile_visibility").$type().default("PUBLIC").notNull(),
    followersVisibility: text("followers_visibility").$type().default("PUBLIC").notNull(),
    followingVisibility: text("following_visibility").$type().default("PUBLIC").notNull(),
    activityVisibility: text("activity_visibility").$type().default("PUBLIC").notNull(),
    searchVisibility: boolean("search_visibility").default(true).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const blocks = pgTable("blocks", {
    blockerId: uuid("blocker_id").references(() => users.id).notNull(),
    blockedId: uuid("blocked_id").references(() => users.id).notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.blockerId, t.blockedId] }),
    blockedIdx: index("blocked_idx").on(t.blockedId), // For "who blocked me" lookups
}));
export const usernameHistory = pgTable("username_history", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
    oldUsername: text("old_username").notNull(),
    newUsername: text("new_username").notNull(),
    changedAt: timestamp("changed_at").defaultNow().notNull(),
}, (t) => ({
    userIdx: index("username_history_user_idx").on(t.userId),
}));
export const identityProviders = pgTable("identity_providers", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    provider: text("provider").$type().notNull(),
    providerId: text("provider_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
    uniqueProviderConfig: index("provider_unique_idx").on(t.provider, t.providerId),
}));
export const sessions = pgTable("sessions", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
    refreshTokenHash: text("refresh_token_hash").notNull(),
    deviceId: text("device_id").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    isValid: boolean("is_valid").default(true).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
}, (t) => ({
    userDeviceIdx: index("user_device_idx").on(t.userId, t.deviceId),
}));
export const mfaSecrets = pgTable("mfa_secrets", {
    userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    secret: text("secret").notNull(),
    backupCodes: jsonb("backup_codes").$type().default([]),
    isEnabled: boolean("is_enabled").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const auditLogs = pgTable("audit_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id),
    action: text("action").notNull(),
    status: text("status").$type().notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const follows = pgTable("follows", {
    followerId: uuid("follower_id").references(() => users.id).notNull(),
    followingId: uuid("following_id").references(() => users.id).notNull(),
    status: text("status").$type().default("ACCEPTED").notNull(), // For private accounts
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.followerId, t.followingId] }),
}));
export const usersRelations = relations(users, ({ many, one }) => ({
    followers: many(follows, { relationName: "followers" }),
    following: many(follows, { relationName: "following" }),
    privacy: one(userPrivacy),
    counters: one(userCounters),
    posts: many(posts),
    comments: many(comments),
    likes: many(likes),
    notifications: many(notifications),
    sessions: many(sessions),
    identityProviders: many(identityProviders),
    mfaSecret: one(mfaSecrets),
}));
export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}));
export const identityProvidersRelations = relations(identityProviders, ({ one }) => ({
    user: one(users, {
        fields: [identityProviders.userId],
        references: [users.id],
    }),
}));
export const followsRelations = relations(follows, ({ one }) => ({
    follower: one(users, {
        fields: [follows.followerId],
        references: [users.id],
        relationName: "following",
    }),
    following: one(users, {
        fields: [follows.followingId],
        references: [users.id],
        relationName: "followers",
    }),
}));
export const posts = pgTable("posts", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    content: text("content").notNull(),
    originalPostId: uuid("original_post_id"),
    codeSnippet: text("code_snippet"),
    language: varchar("language", { length: 50 }),
    mediaUrls: jsonb("media_urls").$type().default([]),
    tags: jsonb("tags").$type().default([]),
    status: text("status").$type().default("PUBLISHED").notNull(),
    commentsCount: integer("comments_count").default(0).notNull(),
    likesCount: integer("likes_count").default(0).notNull(),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
    userStatusIdx: index("user_status_created_idx").on(t.userId, t.status, t.createdAt.desc()),
    tagsIdx: index("tags_idx").on(t.tags),
}));
export const postVersions = pgTable("post_versions", {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id").references(() => posts.id, { onDelete: 'cascade' }).notNull(),
    content: text("content").notNull(),
    codeSnippet: text("code_snippet"),
    language: varchar("language", { length: 50 }),
    mediaUrls: jsonb("media_urls").$type().default([]),
    version: integer("version").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
    postIdx: index("post_version_idx").on(t.postId, t.version),
}));
export const media = pgTable("media", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    postId: uuid("post_id").references(() => posts.id, { onDelete: 'set null' }),
    type: text("type").$type().notNull(),
    url: text("url").notNull(),
    metadata: jsonb("metadata").$type().notNull(),
    status: text("status").$type().default("PENDING").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const hashtags = pgTable("hashtags", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).unique().notNull(),
    postsCount: integer("posts_count").default(0).notNull(),
    lastUsedAt: timestamp("last_used_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const postHashtags = pgTable("post_hashtags", {
    postId: uuid("post_id").references(() => posts.id, { onDelete: 'cascade' }).notNull(),
    hashtagId: uuid("hashtag_id").references(() => hashtags.id, { onDelete: 'cascade' }).notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.postId, t.hashtagId] }),
    hashtagIdx: index("hashtag_posts_idx").on(t.hashtagId),
}));
export const comments = pgTable("comments", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    postId: uuid("post_id").references(() => posts.id).notNull(),
    parentId: uuid("parent_id"),
    content: text("content").notNull(),
    likesCount: integer("likes_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
    postCreatedAtIndex: index("post_created_at_idx").on(t.postId, t.createdAt.desc()),
    parentIndex: index("parent_id_idx").on(t.parentId),
}));
export const postsRelations = relations(posts, ({ one, many }) => ({
    author: one(users, {
        fields: [posts.userId],
        references: [users.id],
    }),
    comments: many(comments),
}));
export const commentsRelations = relations(comments, ({ one, many }) => ({
    author: one(users, {
        fields: [comments.userId],
        references: [users.id],
    }),
    post: one(posts, {
        fields: [comments.postId],
        references: [posts.id],
    }),
    parent: one(comments, {
        fields: [comments.parentId],
        references: [comments.id],
        relationName: "replies",
    }),
    replies: many(comments, { relationName: "replies" }),
}));
export const celebrityAccounts = pgTable("celebrity_accounts", {
    userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    followerThreshold: integer("follower_threshold").default(50000).notNull(),
    isManualOverride: boolean("is_manual_override").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const userFeedMetadata = pgTable("user_feed_metadata", {
    userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    lastHomeRefreshAt: timestamp("last_home_refresh_at"),
    regionChannel: varchar("region_channel", { length: 50 }), // For multi-region feed routing
    feedVersion: integer("feed_version").default(1).notNull(),
    personalizedWeights: jsonb("personalized_weights").$type().default({ recency: 1.0, affinity: 1.0, engagement: 1.0 }),
});
export const rankingFeatures = pgTable("ranking_features", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
    targetUserId: uuid("target_user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
    affinityScore: integer("affinity_score").default(0).notNull(),
    interactionCount: integer("interaction_count").default(0).notNull(),
    lastInteractionAt: timestamp("last_interaction_at"),
}, (t) => ({
    userAffinityIdx: index("user_affinity_idx").on(t.userId, t.targetUserId),
}));
export const feedRebalanceJobs = pgTable("feed_rebalance_jobs", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
    status: text("status").$type().default("PENDING").notNull(),
    priority: integer("priority").default(0).notNull(),
    payload: jsonb("payload"), // e.g., { affectedPostIds: [] }
    createdAt: timestamp("created_at").defaultNow().notNull(),
    processedAt: timestamp("processed_at"),
}, (t) => ({
    statusIdx: index("rebalance_status_idx").on(t.status, t.createdAt),
}));
export const likes = pgTable("likes", {
    userId: uuid("user_id").references(() => users.id).notNull(),
    targetId: uuid("target_id").notNull(),
    targetType: text("target_type").$type().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.userId, t.targetId, t.targetType] }),
    targetIdx: index("like_target_idx").on(t.targetId, t.targetType),
}));
export const reactions = pgTable("reactions", {
    userId: uuid("user_id").references(() => users.id).notNull(),
    targetId: uuid("target_id").notNull(),
    targetType: text("target_type").$type().notNull(),
    type: text("type").$type().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.userId, t.targetId, t.targetType] }),
    targetIdx: index("reaction_target_idx").on(t.targetId, t.targetType),
}));
export const reposts = pgTable("reposts", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    postId: uuid("post_id").references(() => posts.id).notNull(),
    quoteText: text("quote_text"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
    userPostIdx: index("repost_user_post_idx").on(t.userId, t.postId),
}));
export const engagementCounters = pgTable("engagement_counters", {
    targetId: uuid("target_id").primaryKey(),
    targetType: text("target_type").$type().notNull(),
    likesCount: integer("likes_count").default(0).notNull(),
    reactionsCount: jsonb("reactions_count").$type().default({}).notNull(),
    commentsCount: integer("comments_count").default(0).notNull(),
    repostsCount: integer("reposts_count").default(0).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const likesRelations = relations(likes, ({ one }) => ({
    user: one(users, {
        fields: [likes.userId],
        references: [users.id],
    }),
}));
// --- NOTIFICATION SYSTEM (STAFF/PRINCIPAL DESIGN) ---
export const notificationTemplates = pgTable("notification_templates", {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 100 }).unique().notNull(), // e.g., 'post_liked', 'new_follower'
    titleTemplate: text("title_template").notNull(),
    bodyTemplate: text("body_template").notNull(),
    isPushEnabled: boolean("is_push_enabled").default(true).notNull(),
    isEmailEnabled: boolean("is_email_enabled").default(false).notNull(),
    isInAppEnabled: boolean("is_in_app_enabled").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const notifications = pgTable("notifications", {
    id: uuid("id").primaryKey().defaultRandom(),
    recipientId: uuid("recipient_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
    actorId: uuid("actor_id").references(() => users.id), // Nullable for system notifications
    templateId: uuid("template_id").references(() => notificationTemplates.id),
    entityType: text("entity_type").$type().notNull(),
    entityId: uuid("entity_id").notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    metaData: jsonb("meta_data").$type().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
    recipientIdx: index("recipient_idx").on(t.recipientId),
    unreadIdx: index("unread_idx").on(t.recipientId, t.isRead),
    aggregationIdx: index("aggregation_idx").on(t.recipientId, t.entityId, t.entityType),
    createdIdx: index("notification_created_idx").on(t.recipientId, t.createdAt.desc()),
}));
export const deviceTokens = pgTable("device_tokens", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
    token: text("token").notNull(),
    platform: text("platform").$type().notNull(),
    deviceId: text("device_id"),
    isActive: boolean("is_active").default(true).notNull(),
    lastUsedAt: timestamp("last_used_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
    userTokenUniqueIdx: unique("user_token_unique_idx").on(t.userId, t.token),
}));
export const notificationPreferences = pgTable("notification_preferences", {
    userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
    templateId: uuid("template_id").references(() => notificationTemplates.id).notNull(),
    channel: text("channel").$type().notNull(),
    isEnabled: boolean("is_enabled").default(true).notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.userId, t.templateId, t.channel] }),
}));
export const deliveryAttempts = pgTable("delivery_attempts", {
    id: uuid("id").primaryKey().defaultRandom(),
    notificationId: uuid("notification_id").references(() => notifications.id, { onDelete: 'cascade' }).notNull(),
    channel: text("channel").$type().notNull(),
    status: text("status").$type().notNull(),
    attemptNumber: integer("attempt_number").default(1).notNull(),
    error: text("error"),
    traceId: text("trace_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
    notificationChannelIdx: index("delivery_notif_channel_idx").on(t.notificationId, t.channel),
}));
export const notificationSettings = pgTable("notification_settings", {
    userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    pushEnabled: boolean("push_enabled").default(true).notNull(),
    emailEnabled: boolean("email_enabled").default(false).notNull(),
    quietHoursStart: text("quiet_hours_start"), // e.g., "22:00"
    quietHoursEnd: text("quiet_hours_end"), // e.g., "07:00"
    timezone: text("timezone").default("UTC").notNull(),
});
export const bookmarks = pgTable("bookmarks", {
    userId: uuid("user_id").references(() => users.id).notNull(),
    postId: uuid("post_id").references(() => posts.id).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.userId, t.postId] }),
    userIdx: index("bookmarks_user_idx").on(t.userId, t.createdAt.desc()),
}));
export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
    user: one(users, {
        fields: [bookmarks.userId],
        references: [users.id],
    }),
    post: one(posts, {
        fields: [bookmarks.postId],
        references: [posts.id],
    }),
}));
export const postsSelfRelations = relations(posts, ({ one }) => ({
    originalPost: one(posts, {
        fields: [posts.originalPostId],
        references: [posts.id],
        relationName: "reposts",
    }),
}));
//# sourceMappingURL=schema.js.map