import type { Bot } from "grammy";
import { EventService } from "../../../core/events/event.service.js";
import { prisma } from "../../../db/prisma.js";
import { logger } from "../../../utils/logger.js";
import { mainMenuKeyboard } from "../keyboards/actionKeyboard.js";
import { ruMessages } from "../messages/ru.js";
import type { BotContext } from "../context.js";

export function registerStartCommand(bot: Bot<BotContext>) {
  bot.command("start", async (ctx) => {
    if (ctx.englishFlowUser) {
      logger.info({ userId: ctx.englishFlowUser.id, telegramId: ctx.from?.id }, "start command received");
      await new EventService(prisma).record("USER_STARTED_BOT", ctx.englishFlowUser.id);
    }
    await ctx.reply(ruMessages.start, { reply_markup: mainMenuKeyboard() });
  });
}
