import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { publicKey } from "../config/keys.js";

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // 1. Check Authorization Header (JWT-based)
  const authHeader = request.headers.authorization;
  let token: string | undefined;
  let source = "none";

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
    source = "header";
  }

  // 2. Fallback to 'token' query param (useful for WebSockets)
  if (!token) {
    const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
    token = url.searchParams.get("token") || undefined;
    if (token) source = "query";
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as { sub: string, [key: string]: any };

      if (decoded && decoded.sub) {
        // Set userId in session object for this request
        request.session.userId = decoded.sub;
        request.user = decoded;
        return;
      }
    } catch (err: any) {
      request.log.warn({ err: err.message, source }, "JWT Verification Failed");
    }
  }

  request.log.warn({ source, url: request.url }, "Unauthorized Request");
  return reply.code(401).send({
    success: false,
    message: "Unauthorized",
  });
}
