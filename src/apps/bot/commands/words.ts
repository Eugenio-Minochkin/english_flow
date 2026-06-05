import type { Bot } from "grammy";
import type { VocabularyService } from "../../../core/vocabulary/vocabulary.service.js";
import type { BotContext } from "../context.js";
import { ruMessages } from "../messages/ru.js";

export function registerWordsCommand(bot: Bot<BotContext>, vocabularyService: VocabularyService) {
  bot.command("words", async (ctx) => {
    if (!ctx.englishFlowUser) return;
    const words = await vocabularyService.listLatestVocabularyItems(ctx.englishFlowUser.id, 20);
    await ctx.reply(ruMessages.wordsList(words), { parse_mode: "HTML" });
  });
}
