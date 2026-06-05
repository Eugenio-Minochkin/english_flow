import type { Bot } from "grammy";
import type { BotContext } from "../context.js";
import { ruMessages } from "../messages/ru.js";

export function registerShadowCommand(bot: Bot<BotContext>) {
  bot.command("shadow", async (ctx) => ctx.reply(ruMessages.shadowComingSoon));
}
