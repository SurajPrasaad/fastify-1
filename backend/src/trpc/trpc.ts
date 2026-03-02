import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from './context.js';
import { ZodError } from 'zod';

const t = initTRPC.context<Context>().create({
    errorFormatter({ shape, error }) {
        return {
            ...shape,
            data: {
                ...shape.data,
                zodError:
                    error.cause instanceof ZodError ? error.cause.flatten() : null,
            },
        };
    },
});

export const router = t.router;
export const publicProcedure = t.procedure;

// ─── Auth Middleware ──────────────────────────────────────

const isAuthed = t.middleware(({ next, ctx }) => {
    if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next({
        ctx: {
            user: ctx.user,
        },
    });
});

// ─── Moderator Middleware (MODERATOR, ADMIN, SUPER_ADMIN) ─

const isModerator = t.middleware(({ next, ctx }) => {
    if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    const moderatorRoles = ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'];
    if (!moderatorRoles.includes(ctx.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Moderator role required' });
    }
    return next({
        ctx: {
            user: ctx.user,
        },
    });
});

// ─── Admin Middleware (ADMIN, SUPER_ADMIN only) ──────────

const isAdmin = t.middleware(({ next, ctx }) => {
    if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    const adminRoles = ['ADMIN', 'SUPER_ADMIN'];
    if (!adminRoles.includes(ctx.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin role required' });
    }
    return next({
        ctx: {
            user: ctx.user,
        },
    });
});

// ─── Exported Procedures ─────────────────────────────────

export const protectedProcedure = t.procedure.use(isAuthed);
export const moderatorProcedure = t.procedure.use(isModerator);
export const adminProcedure = t.procedure.use(isAdmin);
