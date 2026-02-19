import type { FastifyReply, FastifyRequest } from "fastify";

export const healthcheck = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
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
