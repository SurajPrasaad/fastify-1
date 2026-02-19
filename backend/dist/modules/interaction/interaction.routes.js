import { requireAuth } from "../../middleware/auth.js";
import { toggleLikeHandler, toggleBookmarkHandler, createCommentHandler, getCommentsHandler, getRepliesHandler, } from "./interaction.controller.js";
import { z } from "zod";
import { toggleLikeSchema, createCommentSchema, getCommentsSchema, getRepliesSchema, } from "./interaction.schema.js";
export async function interactionRoutes(app) {
    const protectedApp = app.withTypeProvider();
    app.get("/", async () => {
        return { message: "Interaction API is running" };
    });
    // All interaction routes require authentication
    protectedApp.addHook("preHandler", requireAuth);
    // Likes
    protectedApp.post("/like", {
        schema: {
            body: toggleLikeSchema,
            tags: ["Interactions"],
            description: "Toggle like on a post or comment",
        },
    }, toggleLikeHandler);
    // Bookmarks
    protectedApp.post("/bookmark/:postId", {
        schema: {
            params: z.object({
                postId: z.string().uuid()
            }),
            tags: ["Interactions"],
            description: "Toggle bookmark for a post",
        },
    }, toggleBookmarkHandler);
    // Comments
    protectedApp.post("/comment", {
        schema: {
            body: createCommentSchema,
            tags: ["Comments"],
            description: "Add a comment or reply",
        },
    }, createCommentHandler);
    protectedApp.get("/post/:postId/comments", {
        schema: {
            params: z.object({
                postId: z.string().uuid()
            }),
            querystring: getCommentsSchema,
            tags: ["Comments"],
            description: "Get root comments for a post",
        },
    }, getCommentsHandler);
    protectedApp.get("/comment/:parentId/replies", {
        schema: {
            params: z.object({
                parentId: z.string().uuid()
            }),
            querystring: getRepliesSchema,
            tags: ["Comments"],
            description: "Get replies for a specific comment",
        },
    }, getRepliesHandler);
}
//# sourceMappingURL=interaction.routes.js.map