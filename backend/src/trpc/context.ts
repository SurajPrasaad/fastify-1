import type { inferAsyncReturnType } from '@trpc/server';
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import jwt from 'jsonwebtoken';
import { publicKey } from '../config/keys.js';

export function createContext({ req, res }: CreateFastifyContextOptions) {
    let user = (req as any).user;

    // Manually decode if not already populated by middleware
    if (!user) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.split(' ')[1];
                if (token) {
                    const decoded = jwt.verify(token, publicKey as string, { algorithms: ['RS256'] }) as any;
                    if (decoded && decoded.sub) {
                        user = { ...decoded, id: decoded.sub };
                    }
                }
            } catch (err) {
                // Ignore invalid token here, middleware will throw if needed
            }
        }
    }

    return {
        req,
        res,
        user,
    };
}

export type Context = inferAsyncReturnType<typeof createContext>;
