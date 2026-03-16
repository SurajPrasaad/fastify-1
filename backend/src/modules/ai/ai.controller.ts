import type { FastifyReply, FastifyRequest } from "fastify";
import { aiService } from "./ai.service.js";
import { z } from "zod";

export const aiController = {
    async generate(request: FastifyRequest, reply: FastifyReply) {
        const schema = z.object({
            prompt: z.string().min(1)
        });

        const result = schema.safeParse(request.body);
        if (!result.success) {
            return reply.status(400).send({ error: "Prompt is required" });
        }

        try {
            const data = await aiService.generatePost(result.data.prompt);
            return reply.send(data);
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({ error: "Failed to generate AI content" });
        }
    },

    async improve(request: FastifyRequest, reply: FastifyReply) {
        const schema = z.object({
            content: z.string().min(1)
        });

        const result = schema.safeParse(request.body);
        if (!result.success) {
            return reply.status(400).send({ error: "Content is required" });
        }

        try {
            const text = await aiService.improvePost(result.data.content);
            return reply.send({ text });
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({ error: "Failed to improve AI content" });
        }
    }
};
