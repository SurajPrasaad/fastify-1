import { router } from "./trpc.js";
import { moderationRouter } from "./routers/moderation.router.js";
import { adminRouter } from "./routers/admin.router.js";
import { postRouter } from "./routers/post.router.js";
import { appealsRouter } from "./routers/appeals.router.js";
import { roomRouter } from "./routers/room.router.js";

export const appRouter = router({
    moderation: moderationRouter,
    admin: adminRouter,
    posts: postRouter,
    appeals: appealsRouter,
    rooms: roomRouter,
});

export type AppRouter = typeof appRouter;
