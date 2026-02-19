export const healthcheck = async (request, reply) => {
    return reply.send({
        status: "OK",
        uptime: process.uptime(),
        timeStamp: Date.now(),
    });
};
export const livenessCheck = async () => {
    return { status: "alive" };
};
export const readinessCheck = async () => {
    const isDatabaseConnected = true;
    if (!isDatabaseConnected) {
        return { status: "not ready" };
    }
    return {
        status: "ready",
    };
};
//# sourceMappingURL=health.controller.js.map