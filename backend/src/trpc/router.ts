import { router } from "./trpc.js";
import { moderationRouter } from "./routers/moderation.router.js";
import { adminRouter } from "./routers/admin.router.js";
import { postRouter } from "./routers/post.router.js";
import { appealsRouter } from "./routers/appeals.router.js";

export const appRouter = router({
    moderation: moderationRouter,
    admin: adminRouter,
    posts: postRouter,
    appeals: appealsRouter,
});

export type AppRouter = typeof appRouter;
