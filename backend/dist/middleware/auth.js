import jwt from "jsonwebtoken";
import { publicKey } from "../config/keys.js";
export async function requireAuth(request, reply) {
    // 1. Check Authorization Header (JWT-based)
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const parts = authHeader.split(" ");
        if (parts.length === 2 && parts[1]) {
            const token = parts[1];
            try {
                const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
                if (decoded && decoded.sub) {
                    // Set userId in session object for this request
                    // This ensures the rest of the application can find the user ID
                    request.session.userId = decoded.sub;
                    request.user = decoded;
                    return;
                }
            }
            catch (err) {
                // Token is invalid or expired
            }
        }
    }
    return reply.code(401).send({
        success: false,
        message: "Unauthorized",
    });
}
//# sourceMappingURL=auth.js.map