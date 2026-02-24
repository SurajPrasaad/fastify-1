import type { FastifyReply, FastifyRequest } from "fastify";
import { UserService } from "./user.service.js";
import type { CreateUserDto, UpdateUserDto, UpdateUserPrivacyDto, UpdateNotificationSettingsDto } from "./user.dto.js";

export class UserController {
  constructor(private userService: UserService) { }

  createUserHandler = async (
    request: FastifyRequest<{ Body: CreateUserDto }>,
    reply: FastifyReply
  ) => {
    const user = await this.userService.createUser(request.body);
    return reply.status(201).send(user);
  };

  getUserProfileHandler = async (
    request: FastifyRequest<{ Params: { username: string } }>,
    reply: FastifyReply
  ) => {
    const { username } = request.params;
    // @ts-ignore
    const currentUserId = request.user?.sub;
    const user = await this.userService.getProfile(username, currentUserId);
    return reply.status(200).send(user);
  };

  followUserHandler = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const { id: targetId } = request.params;
    // @ts-ignore
    const followerId = request.user.sub;

    await this.userService.followUser(followerId, targetId);
    return reply.status(200).send({ message: "Followed successfully" });
  };

  unfollowUserHandler = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const { id: targetId } = request.params;
    // @ts-ignore
    const followerId = request.user.sub;

    await this.userService.unfollowUser(followerId, targetId);
    return reply.status(200).send({ message: "Unfollowed successfully" });
  };

  getSuggestionsHandler = async (
    request: FastifyRequest<{ Querystring: { userId: string } }>,
    reply: FastifyReply
  ) => {
    const { userId } = request.query;
    const suggestions = await this.userService.getSuggestions(userId);
    return reply.status(200).send(suggestions);
  };

  getUsersByTechStackHandler = async (
    request: FastifyRequest<{ Querystring: { tech: string } }>,
    reply: FastifyReply
  ) => {
    const { tech } = request.query;
    const users = await this.userService.findByTechStack(tech);
    return reply.status(200).send(users);
  };

  getAllUsersHandler = async (
    request: FastifyRequest<{ Querystring: { limit?: number; offset?: number } }>,
    reply: FastifyReply
  ) => {
    const limit = request.query.limit || 20;
    const offset = request.query.offset || 0;
    const users = await this.userService.getAll(limit, offset);
    return reply.status(200).send(users);
  };

  updateProfileHandler = async (
    request: FastifyRequest<{ Body: UpdateUserDto }>,
    reply: FastifyReply
  ) => {
    // @ts-ignore
    const userId = request.user.sub;
    const user = await this.userService.updateProfile(userId, request.body);
    return reply.status(200).send(user);
  };

  getFollowersHandler = async (
    request: FastifyRequest<{ Params: { username: string }; Querystring: { limit?: number; offset?: number } }>,
    reply: FastifyReply
  ) => {
    const { username } = request.params;
    const { limit, offset } = request.query;
    // @ts-ignore
    const viewerId = request.user?.sub;
    const followers = await this.userService.getFollowers(username, viewerId, limit, offset);
    return reply.status(200).send(followers);
  };

  getFollowingHandler = async (
    request: FastifyRequest<{ Params: { username: string }; Querystring: { limit?: number; offset?: number } }>,
    reply: FastifyReply
  ) => {
    const { username } = request.params;
    const { limit, offset } = request.query;
    // @ts-ignore
    const viewerId = request.user?.sub;
    const following = await this.userService.getFollowing(username, viewerId, limit, offset);
    return reply.status(200).send(following);
  };

  deactivateAccountHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    // @ts-ignore
    const userId = request.user.sub;
    await this.userService.updateProfile(userId, { status: "DEACTIVATED" });
    return reply.status(200).send({ message: "Account deactivated successfully" });
  };

  deleteAccountHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    // @ts-ignore
    const userId = request.user.sub;
    await this.userService.updateProfile(userId, { status: "DELETED" });
    return reply.status(200).send({ message: "Account deleted successfully" });
  };

  getPrivacyHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    // @ts-ignore
    const userId = request.user.sub;
    const privacy = await this.userService.getPrivacy(userId);
    return reply.status(200).send(privacy);
  };

  updatePrivacyHandler = async (
    request: FastifyRequest<{ Body: UpdateUserPrivacyDto }>,
    reply: FastifyReply
  ) => {
    // @ts-ignore
    const userId = request.user.sub;
    const privacy = await this.userService.updatePrivacy(userId, request.body);
    return reply.status(200).send({ message: "Privacy settings updated", privacy });
  };
  getSecurityHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    // @ts-ignore
    const userId = request.user.sub;
    // @ts-ignore
    const sessionId = request.user.sid;
    const security = await this.userService.getSecurity(userId, sessionId);
    return reply.status(200).send(security);
  };

  revokeSessionHandler = async (
    request: FastifyRequest<{ Params: { sessionId: string } }>,
    reply: FastifyReply
  ) => {
    // @ts-ignore
    const userId = request.user.sub;
    const { sessionId } = request.params;
    await this.userService.revokeSession(userId, sessionId);
    return reply.status(200).send({ message: "Session revoked successfully" });
  };

  revokeAppHandler = async (
    request: FastifyRequest<{ Params: { appId: string } }>,
    reply: FastifyReply
  ) => {
    // @ts-ignore
    const userId = request.user.sub;
    const { appId } = request.params;
    await this.userService.revokeApp(userId, appId);
    return reply.status(200).send({ message: "App access revoked successfully" });
  };

  getNotificationSettingsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    // @ts-ignore
    const userId = request.user.sub;
    const settings = await this.userService.getNotificationSettings(userId);
    return reply.status(200).send(settings);
  };

  updateNotificationSettingsHandler = async (
    request: FastifyRequest<{ Body: UpdateNotificationSettingsDto }>,
    reply: FastifyReply
  ) => {
    // @ts-ignore
    const userId = request.user.sub;
    const settings = await this.userService.updateNotificationSettings(userId, request.body);
    return reply.status(200).send({ message: "Notification settings updated", settings });
  };
}
