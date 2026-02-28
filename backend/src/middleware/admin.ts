import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../utils/AppError.js";

export async function requireAdmin(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const user = request.user as { role?: string } | undefined;

    if (!user || user.role !== "ADMIN") {
        throw new AppError("Forbidden: Admin access required", 403);
    }
}
