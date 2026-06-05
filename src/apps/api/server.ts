import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "../../utils/env.js";
import { logger } from "../../utils/logger.js";
import { isMainModule } from "../../utils/module.js";
import { createEnglishFlowBot, telegramWebhookHandler } from "../bot/bot.js";
import { registerHealthRoutes } from "./routes/health.routes.js";
import { registerAuthRoutes } from "./routes/auth.routes.js";
import { registerDrillsRoutes } from "./routes/drills.routes.js";
import { registerVocabularyRoutes } from "./routes/vocabulary.routes.js";
import { registerReviewsRoutes } from "./routes/reviews.routes.js";
import { registerStatsRoutes } from "./routes/stats.routes.js";
import { registerSettingsRoutes } from "./routes/settings.routes.js";
import { registerThoughtsRoutes } from "./routes/thoughts.routes.js";

export async function buildServer() {
  const app = Fastify({ logger: { level: env.LOG_LEVEL } });
  await app.register(cors, { origin: true });
  await registerHealthRoutes(app);
  await registerAuthRoutes(app);
  await registerDrillsRoutes(app);
  await registerVocabularyRoutes(app);
  await registerReviewsRoutes(app);
  await registerStatsRoutes(app);
  await registerSettingsRoutes(app);
  await registerThoughtsRoutes(app);

  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_WEBHOOK_URL) {
    const bot = createEnglishFlowBot();
    app.post("/telegram/webhook", telegramWebhookHandler(bot));
  }

  return app;
}

export async function startServer() {
  const app = await buildServer();
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
}

if (isMainModule(import.meta.url)) {
  startServer().catch((error) => {
    logger.error({ err: error }, "server failed");
    process.exit(1);
  });
}
