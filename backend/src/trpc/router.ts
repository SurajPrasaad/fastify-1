import { router } from "./trpc.js";
import { moderationRouter } from "./routers/moderation.router.js";
import { adminRouter } from "./routers/admin.router.js";
import { postRouter } from "./routers/post.router.js";

export const appRouter = router({
    moderation: moderationRouter,
    admin: adminRouter,
    posts: postRouter,
});

export type AppRouter = typeof appRouter;
