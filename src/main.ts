import { env } from "./utils/env.js";
import { logger } from "./utils/logger.js";
import { startServer } from "./apps/api/server.js";
import { createEnglishFlowBot } from "./apps/bot/bot.js";

async function main() {
  await startServer();
  if (env.TELEGRAM_BOT_TOKEN && !env.TELEGRAM_WEBHOOK_URL) {
    const bot = createEnglishFlowBot();
    bot.start();
    logger.info("Telegram bot started in polling mode.");
  }
}

main().catch((error) => {
  logger.error({ err: error }, "app failed");
  process.exit(1);
});
