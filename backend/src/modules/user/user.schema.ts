import { z } from "zod";
import type { FastifySchema } from "fastify";

// Shared Schemas
const userCore = {
  username: z.string().min(3).max(30),
  email: z.string().email(),
  name: z.string().min(2),
  bio: z.string().max(500).nullable().optional(),
  techStack: z.array(z.string()).default([]),
  avatarUrl: z.string().url().nullable().optional(),
  coverUrl: z.string().url().nullable().optional(),
  website: z.string().url().nullable().optional(),
  location: z.string().max(100).nullable().optional(),
  phoneNumber: z.string().max(20).nullable().optional(),
  subscriptionPlan: z.enum(["FREE", "PREMIUM", "PREMIUM_PRO"]).default("FREE"),
  status: z.enum(["ACTIVE", "DEACTIVATED", "SUSPENDED", "DELETED"]).default("ACTIVE"),
};

const userResponse = z.object({
  id: z.string().uuid(),
  ...userCore,
  followersCount: z.number().int(),
  followingCount: z.number().int(),
  postsCount: z.number().int(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

// Zod Schemas
export const createUserSchema = z.object({
  ...userCore,
  password: z.string().min(8),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  username: z.string().min(3).max(30).optional(),
  techStack: z.array(z.string()).optional(),
  bio: z.string().max(500).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  coverUrl: z.string().url().nullable().optional(),
  website: z.string().url().nullable().optional(),
  location: z.string().max(100).nullable().optional(),
  phoneNumber: z.string().max(20).nullable().optional(),
  subscriptionPlan: z.enum(["FREE", "PREMIUM", "PREMIUM_PRO"]).optional(),
  status: z.enum(["ACTIVE", "DEACTIVATED", "SUSPENDED", "DELETED"]).optional(),
});

export const userParamsSchema = z.object({
  username: z.string(),
});

export const userIdParamsSchema = z.object({
  id: z.string().uuid(),
})


// Fastify Route Schemas
export const createUserRouteSchema = {
  body: createUserSchema,
  response: {
    201: userResponse,
  },
};

export const getUserProfileSchema = {
  params: userParamsSchema,
  // response: { 200: userResponse }, // Omitted for brevity/flexibility in response wrapper
};

export const followUserSchema = {
  params: userIdParamsSchema,
};

export const unfollowUserSchema = {
  params: userIdParamsSchema,
};

export const getSuggestionsSchema = {
  querystring: z.object({
    userId: z.string().uuid(),
  }),
};

export const getByTechStackSchema = {
  querystring: z.object({
    tech: z.string()
  })
}

export const getAllUsersSchema = {
  querystring: z.object({
    limit: z.coerce.number().positive().default(20),
    offset: z.coerce.number().nonnegative().default(0),
  }),
};

export const updateProfileRouteSchema = {
  body: updateUserSchema,
  response: {
    200: userResponse,
  },
};

export const getFollowsSchema = {
  params: userParamsSchema,
  querystring: z.object({
    limit: z.coerce.number().positive().default(20),
    offset: z.coerce.number().nonnegative().default(0),
  }),
};

export const updatePrivacySchema = z.object({
  profileVisibility: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE"]).optional(),
  followersVisibility: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE"]).optional(),
  followingVisibility: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE"]).optional(),
  activityVisibility: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE"]).optional(),
  searchVisibility: z.boolean().optional(),
});

export const updatePrivacyRouteSchema = {
  body: updatePrivacySchema,
  response: {
    200: z.object({
      message: z.string(),
      privacy: updatePrivacySchema
    })
  }
};

export const getUserPrivacySchema = {
  response: {
    200: updatePrivacySchema
  }
};

// Security Schemas
export const getSecuritySchema = {
  response: {
    200: z.object({
      passwordMetadata: z.object({
        lastChangedAt: z.union([z.date(), z.string()]).nullable(),
      }),
      mfaStatus: z.object({
        isEnabled: z.boolean(),
      }),
      sessions: z.array(z.object({
        id: z.string().uuid(),
        deviceId: z.string(),
        ipAddress: z.string().nullable(),
        userAgent: z.string().nullable(),
        lastActiveAt: z.union([z.date(), z.string()]),
        isCurrent: z.boolean(),
      })),
      connectedApps: z.array(z.object({
        id: z.string().uuid(),
        provider: z.string(),
        providerId: z.string(),
        createdAt: z.union([z.date(), z.string()]),
      })),
    })
  }
};

export const revokeSessionParamsSchema = z.object({
  sessionId: z.string().uuid(),
});

export const revokeAppParamsSchema = z.object({
  appId: z.string().uuid(),
});

export const revokeSessionRouteSchema = {
  params: revokeSessionParamsSchema,
};

export const revokeAppRouteSchema = {
  params: revokeAppParamsSchema,
};

// Notification Settings Schemas
export const notificationSettingsSchema = z.object({
  pushNotifications: z.object({
    likes: z.boolean(),
    comments: z.boolean(),
    mentions: z.boolean(),
    follows: z.boolean(),
    reposts: z.boolean(),
    messages: z.boolean(),
  }),
  emailNotifications: z.object({
    weeklySummary: z.boolean(),
    securityAlerts: z.boolean(),
    productUpdates: z.boolean(),
  }),
});

export const updateNotificationSettingsSchema = z.object({
  pushNotifications: z.object({
    likes: z.boolean().optional(),
    comments: z.boolean().optional(),
    mentions: z.boolean().optional(),
    follows: z.boolean().optional(),
    reposts: z.boolean().optional(),
    messages: z.boolean().optional(),
  }).optional(),
  emailNotifications: z.object({
    weeklySummary: z.boolean().optional(),
    securityAlerts: z.boolean().optional(),
    productUpdates: z.boolean().optional(),
  }).optional(),
});

export const getNotificationSettingsRouteSchema = {
  response: {
    200: notificationSettingsSchema,
  },
};

export const updateNotificationSettingsRouteSchema = {
  body: updateNotificationSettingsSchema,
  response: {
    200: z.object({
      message: z.string(),
      settings: notificationSettingsSchema,
    }),
  },
};
