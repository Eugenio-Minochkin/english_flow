import type { Bot } from "grammy";
import type { BotContext } from "../context.js";
import { ruMessages } from "../messages/ru.js";

export function registerStatsCommand(bot: Bot<BotContext>) {
  bot.command("stats", async (ctx) => ctx.reply(ruMessages.statsComingSoon));
}
