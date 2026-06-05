import type { Bot } from "grammy";
import { ruMessages } from "../messages/ru.js";
import type { BotContext } from "../context.js";

export function registerHelpCommand(bot: Bot<BotContext>) {
  bot.command("help", async (ctx) => ctx.reply(ruMessages.help));
}
