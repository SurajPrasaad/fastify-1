import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { publicKey } from "../config/keys.js";

export async function optionalAuth(
    request: FastifyRequest
) {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const parts = authHeader.split(" ");
        if (parts.length === 2 && parts[1]) {
            const token = parts[1];
            try {
                const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as { sub: string, [key: string]: any };
                if (decoded && decoded.sub) {
                    request.session.userId = decoded.sub;
                    request.user = decoded;
                }
            } catch (err) {
                // Silent fail for optional auth
            }
        }
    }
}
