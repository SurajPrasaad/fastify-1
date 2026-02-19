import * as controller from "../health/health.controller.js";
export default async function healthRoutes(fastify) {
    fastify.get("/health", controller.healthcheck);
    fastify.get("/health/live", controller.livenessCheck);
    fastify.get("/health/ready", controller.readinessCheck);
}
//# sourceMappingURL=health.route.js.map