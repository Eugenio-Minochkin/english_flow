import type { FastifyInstance } from "fastify";

export async function registerAuthRoutes(app: FastifyInstance) {
  app.get("/api/me", async (_request, reply) => {
    return reply.code(501).send({ error: "Telegram Mini App auth is planned for a later milestone." });
  });
}
