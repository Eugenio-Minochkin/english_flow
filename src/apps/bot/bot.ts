import { Bot, webhookCallback } from "grammy";
import { env } from "../../utils/env.js";
import { logger } from "../../utils/logger.js";
import { isMainModule } from "../../utils/module.js";
import type { BotContext } from "./context.js";
import { createBotDependencies } from "./dependencies.js";
import { allowlistedUserMiddleware } from "./middleware.js";
import { registerStartCommand } from "./commands/start.js";
import { registerHelpCommand } from "./commands/help.js";
import { registerDrillCommand } from "./commands/drill.js";
import { registerShadowCommand } from "./commands/shadow.js";
import { registerWordCommand } from "./commands/word.js";
import { registerLessonAfterCommand } from "./commands/lessonAfter.js";
import { registerThoughtCommand } from "./commands/thought.js";
import { registerReviewCommand } from "./commands/review.js";
import { registerPracticeCommand } from "./commands/practice.js";
import { registerWordsCommand } from "./commands/words.js";
import { registerStatsCommand } from "./commands/stats.js";
import { registerSettingsCommand } from "./commands/settings.js";
import { registerVoiceHandler } from "./handlers/voiceHandler.js";
import { registerTextHandler } from "./handlers/textHandler.js";
import { registerCallbackHandler } from "./handlers/callbackHandler.js";
import { registerAdminCommands } from "./commands/admin.js";

export function createEnglishFlowBot() {
  if (!env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is required.");
  }
  const bot = new Bot<BotContext>(env.TELEGRAM_BOT_TOKEN);
  const deps = createBotDependencies(bot);
  bot.use(allowlistedUserMiddleware(deps.userService));
  registerStartCommand(bot);
  registerHelpCommand(bot);
  registerDrillCommand(bot, deps.drillService);
  registerShadowCommand(bot);
  registerWordCommand(bot, deps.vocabularyService);
  registerLessonAfterCommand(bot, deps.lessonImportService);
  registerThoughtCommand(bot);
  registerReviewCommand(bot, deps.drillService);
  registerPracticeCommand(bot, deps.drillService);
  registerWordsCommand(bot, deps.vocabularyService);
  registerStatsCommand(bot);
  registerSettingsCommand(bot);
  registerAdminCommands(bot, deps.scheduledRepService);
  registerCallbackHandler(bot, deps.drillService, deps.scheduledRepService, deps.vocabularyService);
  registerVoiceHandler(bot, deps.drillService, deps.telegramFileService);
  registerTextHandler(bot, deps.drillService, deps.vocabularyService, deps.lessonImportService, deps.scheduledRepService);
  bot.catch((err) => {
    logger.error(
      {
        errorName: err.error instanceof Error ? err.error.name : undefined,
        errorMessage: err.error instanceof Error ? err.error.message : String(err.error),
        updateId: err.ctx.update.update_id,
        fromId: err.ctx.from?.id
      },
      "bot error"
    );
  });
  return bot;
}

export function telegramWebhookHandler(bot: Bot<BotContext>) {
  return webhookCallback(bot, "fastify", { secretToken: env.TELEGRAM_WEBHOOK_SECRET || undefined });
}

if (isMainModule(import.meta.url)) {
  const bot = createEnglishFlowBot();
  bot.start();
  logger.info("Telegram bot started in polling mode.");
}
