import { redis } from "../../config/redis.js";
import { UserRepository } from "./user.repository.js";
import type { CreateUserDto, UpdateUserDto } from "./user.dto.js";
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

  async getSuggestions(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user || !user.techStack) return [];

    return this.userRepository.suggestUsers(userId, user.techStack);
  }

  async findByTechStack(tech: string) {
    return this.userRepository.findByTechStack(tech);
  }

  async getAll(limit: number, offset: number) {
    return this.userRepository.findAll(limit, offset);
  }

  async updateProfile(userId: string, data: UpdateUserDto) {
    const user = await this.userRepository.update(userId, data);
    if (!user) throw new AppError("User not found", 404);

    // Invalidate cache
    await redis.del(`user:profile:${user.username}`);
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
}
