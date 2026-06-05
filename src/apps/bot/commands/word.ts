import type { Bot } from "grammy";
import { UserStateService } from "../../../core/state/userState.service.js";
import type { VocabularyService } from "../../../core/vocabulary/vocabulary.service.js";
import { prisma } from "../../../db/prisma.js";
import type { BotContext } from "../context.js";
import { ruMessages } from "../messages/ru.js";

export function registerWordCommand(bot: Bot<BotContext>, vocabularyService: VocabularyService) {
  bot.command("word", async (ctx) => {
    if (!ctx.englishFlowUser) return;
    const word = ctx.message?.text.replace(/^\/word(@\w+)?\s*/i, "").trim();
    if (!word) {
      await new UserStateService(prisma).set(ctx.englishFlowUser.id, "WAITING_FOR_WORD_INPUT", {});
      await ctx.reply(ruMessages.askWordInput);
      return;
    }

    const result = await vocabularyService.createVocabularyCard(ctx.englishFlowUser.id, word);
    await ctx.reply(ruMessages.wordSaved);
    await ctx.reply(ruMessages.vocabularyCard(result.card), { parse_mode: "HTML" });
  });
}
