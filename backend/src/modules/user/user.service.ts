import { redis } from "../../config/redis.js";
import { UserRepository } from "./user.repository.js";
import type { CreateUserDto, UpdateUserDto, UpdateUserPrivacyDto, NotificationSettingsDto, UpdateNotificationSettingsDto } from "./user.dto.js";
import { AppError } from "../../utils/AppError.js";
import { triggerFollowNotification } from "../notification/notification.triggers.js";

export class UserService {
  constructor(private userRepository: UserRepository) { }

  async createUser(data: CreateUserDto) {
    const existing = await this.userRepository.findByUsername(data.username);
    if (existing) throw new AppError("Username already taken", 409);

    // Hash password logic would go here

    return this.userRepository.create(data);
  }

  async getProfile(username: string, currentUserId?: string) {
    const cacheKey = `user:profile:${username}`;

    // 1. Check Redis Cache - Only if not logged in (to avoid complex cache invalidation for follow status)
    if (!currentUserId) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    // 2. Fetch from DB
    const user = await this.userRepository.findByUsername(username);
    if (!user) throw new AppError("User not found", 404);

    let isFollowing = false;
    if (currentUserId) {
      isFollowing = await this.userRepository.isFollowing(currentUserId, user.id);
    }

    const response = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      bio: user.bio || null,
      avatarUrl: user.avatarUrl || null,
      coverUrl: user.coverUrl || null,
      website: user.website || null,
      location: user.location || null,
      profile: {
        techStack: user.techStack || [],
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        postsCount: user.postsCount,
      },
      auth: {
        isEmailVerified: user.isEmailVerified,
        status: user.status,
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isFollowing,
      isSelf: currentUserId === user.id
    };

    // 3. Cache for 60 seconds (Only for public view)
    if (!currentUserId) {
      await redis.set(cacheKey, JSON.stringify(response), "EX", 60);
    }

    return response;
  }

  async followUser(actorId: string, targetId: string) {
    if (actorId === targetId) {
      throw new AppError("Cannot follow yourself", 400);
    }

    await this.userRepository.followUser(actorId, targetId);

    // 🔔 Fire FOLLOW notification
    triggerFollowNotification(actorId, targetId);
  }

  async unfollowUser(actorId: string, targetId: string) {
    if (actorId === targetId) {
      throw new AppError("Cannot unfollow yourself", 400);
    }

    await this.userRepository.unfollowUser(actorId, targetId);
  }

  async getSuggestions(userId: string, limit: number = 10) {
    const user = await this.userRepository.findById(userId);
    if (!user || !user.techStack) return [];

    return this.userRepository.suggestUsers(userId, user.techStack, limit);
  }

  async findByTechStack(tech: string) {
    return this.userRepository.findByTechStack(tech);
  }

  async searchUsers(query: string, limit: number = 10) {
    return this.userRepository.search(query, limit);
  }

  async getActiveFriends(userId: string) {
    const followedIds = await this.userRepository.getFollowedUserIds(userId);
    if (!followedIds.length) return [];

    // Batch check presence in Redis
    const pipeline = redis.pipeline();
    followedIds.forEach(id => pipeline.get(`presence:${id}`));
    const statuses = await pipeline.exec();

    const onlineIds = followedIds.filter((id, index) => {
      const status = statuses?.[index]?.[1];
      return status === "ONLINE";
    });

    if (!onlineIds.length) return [];

    return this.userRepository.findByIds(onlineIds);
  }

  async getAll(limit: number, offset: number) {
    return this.userRepository.findAll(limit, offset);
  }

  async updateProfile(userId: string, data: UpdateUserDto) {
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) throw new AppError("User not found", 404);

    if (data.username && data.username !== existingUser.username) {
      const isTaken = await this.userRepository.findByUsername(data.username);
      if (isTaken) throw new AppError("Username already taken", 409);
    }

    const user = await this.userRepository.update(userId, data);
    if (!user) throw new AppError("Failed to update profile", 500);

    // Invalidate cache for both old and new username if it changed
    await redis.del(`user:profile:${existingUser.username}`);
    if (data.username) {
      await redis.del(`user:profile:${data.username}`);
    }

    return user;
  }

  async getFollowers(username: string, viewerId?: string, limit: number = 20, offset: number = 0) {
    const user = await this.userRepository.findByUsername(username);
    if (!user) throw new AppError("User not found", 404);

    const followers = await this.userRepository.getFollowers(user.id, limit, offset);

    let followedIds = new Set<string>();
    if (viewerId && followers.length > 0) {
      followedIds = await this.userRepository.findFollowedIds(viewerId, followers.map(f => f.id));
    }

    const enrichedFollowers = followers.map(follower => ({
      ...follower,
      isFollowing: followedIds.has(follower.id),
      isSelf: viewerId === follower.id
    }));

    return enrichedFollowers;
  }

  async getFollowing(username: string, viewerId?: string, limit: number = 20, offset: number = 0) {
    const user = await this.userRepository.findByUsername(username);
    if (!user) throw new AppError("User not found", 404);

    const following = await this.userRepository.getFollowing(user.id, limit, offset);

    let followedIds = new Set<string>();
    if (viewerId && following.length > 0) {
      followedIds = await this.userRepository.findFollowedIds(viewerId, following.map(f => f.id));
    }

    const enrichedFollowing = following.map(followedUser => ({
      ...followedUser,
      isFollowing: followedIds.has(followedUser.id),
      isSelf: viewerId === followedUser.id
    }));

    return enrichedFollowing;
  }

  async getPrivacy(userId: string) {
    return this.userRepository.getPrivacy(userId);
  }

  async updatePrivacy(userId: string, data: UpdateUserPrivacyDto) {
    return this.userRepository.updatePrivacy(userId, data);
  }
  async getSecurity(userId: string, currentSessionId?: string) {
    const data = await this.userRepository.getSecurityOverview(userId);

    return {
      ...data,
      sessions: data.sessions.map(s => ({
        id: s.id,
        deviceId: s.deviceId,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        lastActiveAt: s.lastActiveAt,
        isCurrent: s.id === currentSessionId,
      })),
    };
  }

  async revokeSession(userId: string, sessionId: string) {
    return this.userRepository.revokeSession(userId, sessionId);
  }

  async revokeApp(userId: string, appId: string) {
    return this.userRepository.revokeApp(userId, appId);
  }

  async getNotificationSettings(userId: string): Promise<NotificationSettingsDto> {
    const settings = await this.userRepository.getNotificationSettings(userId);
    if (!settings) throw new AppError("Failed to fetch notification settings", 500);

    return {
      pushNotifications: {
        likes: settings.granularSettings.push.likes,
        comments: settings.granularSettings.push.comments,
        mentions: settings.granularSettings.push.mentions,
        follows: settings.granularSettings.push.follows,
        reposts: settings.granularSettings.push.reposts,
        messages: settings.granularSettings.push.messages,
      },
      emailNotifications: {
        weeklySummary: settings.granularSettings.email.weeklySummary,
        securityAlerts: settings.granularSettings.email.securityAlerts,
        productUpdates: settings.granularSettings.email.productUpdates,
      }
    };
  }

  async updateNotificationSettings(userId: string, data: UpdateNotificationSettingsDto): Promise<NotificationSettingsDto> {
    const current = await this.userRepository.getNotificationSettings(userId);
    if (!current) throw new AppError("Settings not found", 404);

    const updatedGranular = {
      push: {
        ...current.granularSettings.push,
        ...data.pushNotifications
      },
      email: {
        ...current.granularSettings.email,
        ...data.emailNotifications
      }
    };

    const updated = await this.userRepository.updateNotificationSettings(userId, {
      granularSettings: updatedGranular
    });

    if (!updated) throw new AppError("Failed to update settings", 500);

    return {
      pushNotifications: {
        likes: updated.granularSettings.push.likes,
        comments: updated.granularSettings.push.comments,
        mentions: updated.granularSettings.push.mentions,
        follows: updated.granularSettings.push.follows,
        reposts: updated.granularSettings.push.reposts,
        messages: updated.granularSettings.push.messages,
      },
      emailNotifications: {
        weeklySummary: updated.granularSettings.email.weeklySummary,
        securityAlerts: updated.granularSettings.email.securityAlerts,
        productUpdates: updated.granularSettings.email.productUpdates,
      }
    };
  }

  async setRole(userId: string, role: "USER" | "ADMIN") {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    return this.userRepository.update(userId, { role });
  }

  async getAdminStats() {
    const users = await this.userRepository.findAll(1000, 0);
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === "ACTIVE").length,
    };
  }
}
