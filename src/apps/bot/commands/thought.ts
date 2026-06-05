import type { Bot } from "grammy";
import type { BotContext } from "../context.js";
import { ruMessages } from "../messages/ru.js";

export function registerThoughtCommand(bot: Bot<BotContext>) {
  bot.command("thought", async (ctx) => ctx.reply(ruMessages.thoughtComingSoon));
}
