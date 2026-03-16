import type { FastifyInstance } from "fastify";
import { aiController } from "./ai.controller.js";

export async function aiRoutes(fastify: FastifyInstance) {
    fastify.post("/generate", aiController.generate);
    fastify.post("/improve", aiController.improve);
}
