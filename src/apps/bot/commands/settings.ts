import type { Bot } from "grammy";
import type { BotContext } from "../context.js";
import { ruMessages } from "../messages/ru.js";

export function registerSettingsCommand(bot: Bot<BotContext>) {
  bot.command("settings", async (ctx) => ctx.reply(ruMessages.settingsComingSoon));
}
