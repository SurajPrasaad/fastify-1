import type { FastifyReply, FastifyRequest } from "fastify";
import { UserService } from "./user.service.js";
import type { CreateUserDto, UpdateUserDto } from "./user.dto.js";
export declare class UserController {
    private userService;
    constructor(userService: UserService);
    createUserHandler: (request: FastifyRequest<{
        Body: CreateUserDto;
    }>, reply: FastifyReply) => Promise<never>;
    getUserProfileHandler: (request: FastifyRequest<{
        Params: {
            username: string;
        };
    }>, reply: FastifyReply) => Promise<never>;
    followUserHandler: (request: FastifyRequest<{
        Params: {
            id: string;
        };
    }>, reply: FastifyReply) => Promise<never>;
    unfollowUserHandler: (request: FastifyRequest<{
        Params: {
            id: string;
        };
    }>, reply: FastifyReply) => Promise<never>;
    getSuggestionsHandler: (request: FastifyRequest<{
        Querystring: {
            userId: string;
        };
    }>, reply: FastifyReply) => Promise<never>;
    getUsersByTechStackHandler: (request: FastifyRequest<{
        Querystring: {
            tech: string;
        };
    }>, reply: FastifyReply) => Promise<never>;
    getAllUsersHandler: (request: FastifyRequest<{
        Querystring: {
            limit?: number;
            offset?: number;
        };
    }>, reply: FastifyReply) => Promise<never>;
    updateProfileHandler: (request: FastifyRequest<{
        Body: UpdateUserDto;
    }>, reply: FastifyReply) => Promise<never>;
}
//# sourceMappingURL=user.controller.d.ts.map