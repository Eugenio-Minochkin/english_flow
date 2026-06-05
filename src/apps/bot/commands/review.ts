import type { Bot } from "grammy";
import type { DrillService } from "../../../core/drills/drill.service.js";
import { feedbackActionKeyboard } from "../keyboards/actionKeyboard.js";
import type { BotContext } from "../context.js";
import { ruMessages } from "../messages/ru.js";

export function registerReviewCommand(bot: Bot<BotContext>, drillService: DrillService) {
  bot.command("review", async (ctx) => {
    if (!ctx.englishFlowUser) return;
    const drill = await drillService.startVocabularyDrill(ctx.englishFlowUser);
    if (!drill) {
      await ctx.reply(ruMessages.noVocabularyForReview);
      return;
    }
    await ctx.reply(ruMessages.drillPrompt(drill.promptRu), { parse_mode: "HTML" });
    await ctx.reply(ruMessages.sendVoiceAnswer, { parse_mode: "HTML", reply_markup: feedbackActionKeyboard() });
  });
}
