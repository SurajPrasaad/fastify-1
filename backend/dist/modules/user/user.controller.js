import { UserService } from "./user.service.js";
export class UserController {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    createUserHandler = async (request, reply) => {
        const user = await this.userService.createUser(request.body);
        return reply.status(201).send(user);
    };
    getUserProfileHandler = async (request, reply) => {
        const { username } = request.params;
        // @ts-ignore
        const currentUserId = request.user?.sub;
        const user = await this.userService.getProfile(username, currentUserId);
        return reply.status(200).send(user);
    };
    followUserHandler = async (request, reply) => {
        const { id: targetId } = request.params;
        // @ts-ignore
        const followerId = request.user.sub;
        await this.userService.followUser(followerId, targetId);
        return reply.status(200).send({ message: "Followed successfully" });
    };
    unfollowUserHandler = async (request, reply) => {
        const { id: targetId } = request.params;
        // @ts-ignore
        const followerId = request.user.sub;
        await this.userService.unfollowUser(followerId, targetId);
        return reply.status(200).send({ message: "Unfollowed successfully" });
    };
    getSuggestionsHandler = async (request, reply) => {
        const { userId } = request.query;
        const suggestions = await this.userService.getSuggestions(userId);
        return reply.status(200).send(suggestions);
    };
    getUsersByTechStackHandler = async (request, reply) => {
        const { tech } = request.query;
        const users = await this.userService.findByTechStack(tech);
        return reply.status(200).send(users);
    };
    getAllUsersHandler = async (request, reply) => {
        const limit = request.query.limit || 20;
        const offset = request.query.offset || 0;
        const users = await this.userService.getAll(limit, offset);
        return reply.status(200).send(users);
    };
    updateProfileHandler = async (request, reply) => {
        // @ts-ignore
        const userId = request.user.sub;
        const user = await this.userService.updateProfile(userId, request.body);
        return reply.status(200).send(user);
    };
}
//# sourceMappingURL=user.controller.js.map