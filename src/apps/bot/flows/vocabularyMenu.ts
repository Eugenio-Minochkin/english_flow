import type { UserStateService } from "../../../core/state/userState.service.js";
import type { VocabularyService } from "../../../core/vocabulary/vocabulary.service.js";
import type { BotContext } from "../context.js";
import { vocabularyCallbacks, vocabularyMenuKeyboard } from "../keyboards/actionKeyboard.js";
import { ruMessages } from "../messages/ru.js";

export async function replyWithVocabularyMenu(ctx: Pick<BotContext, "reply">, vocabularyService: VocabularyService, userId: string) {
  const words = await vocabularyService.listLatestVocabularyItems(userId, 20);
  await ctx.reply(ruMessages.wordsList(words), { parse_mode: "HTML", reply_markup: vocabularyMenuKeyboard() });
}

export async function handleVocabularyMenuCallback(
  ctx: Pick<BotContext, "reply" | "answerCallbackQuery" | "englishFlowUser">,
  data: string,
  vocabularyService: VocabularyService,
  stateService: UserStateService
) {
  if (!ctx.englishFlowUser) return false;

  if (data === vocabularyCallbacks.add) {
    await ctx.answerCallbackQuery();
    await stateService.set(ctx.englishFlowUser.id, "WAITING_FOR_WORD_INPUT", {});
    await ctx.reply(ruMessages.askWordInput);
    return true;
  }

  if (data === vocabularyCallbacks.list) {
    await ctx.answerCallbackQuery();
    await replyWithVocabularyMenu(ctx, vocabularyService, ctx.englishFlowUser.id);
    return true;
  }

  return false;
}
