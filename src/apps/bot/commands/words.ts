import type { Bot } from "grammy";
import type { VocabularyService } from "../../../core/vocabulary/vocabulary.service.js";
import type { BotContext } from "../context.js";
import { replyWithVocabularyMenu } from "../flows/vocabularyMenu.js";

export function registerWordsCommand(bot: Bot<BotContext>, vocabularyService: VocabularyService) {
  bot.command("words", async (ctx) => {
    if (!ctx.englishFlowUser) return;
    await replyWithVocabularyMenu(ctx, vocabularyService, ctx.englishFlowUser.id);
  });
}
