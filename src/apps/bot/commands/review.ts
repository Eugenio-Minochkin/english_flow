import type { Bot } from "grammy";
import type { BotContext } from "../context.js";
import { ruMessages } from "../messages/ru.js";

export function registerReviewCommand(bot: Bot<BotContext>) {
  bot.command("review", async (ctx) => ctx.reply(ruMessages.reviewComingSoon));
}
