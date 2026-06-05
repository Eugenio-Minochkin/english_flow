import type { Bot } from "grammy";
import type { DrillService } from "../../../core/drills/drill.service.js";
import { UserFacingError } from "../../../utils/errors.js";
import { logger } from "../../../utils/logger.js";
import { feedbackActionKeyboard } from "../keyboards/actionKeyboard.js";
import { ruMessages } from "../messages/ru.js";
import type { BotContext } from "../context.js";

export function registerDrillCommand(bot: Bot<BotContext>, drillService: DrillService) {
  bot.command("drill", async (ctx) => {
    if (!ctx.englishFlowUser) return;
    try {
      logger.info({ userId: ctx.englishFlowUser.id, telegramId: ctx.from?.id }, "drill command received");
      const drill = await drillService.startRuToEnDrill(ctx.englishFlowUser);
      logger.info({ userId: ctx.englishFlowUser.id, drillId: drill.drillId, sessionId: drill.sessionId }, "drill session created");
      await ctx.reply(ruMessages.drillPrompt(drill.promptRu), { parse_mode: "HTML" });
      await ctx.reply(ruMessages.sendVoiceAnswer, { parse_mode: "HTML", reply_markup: feedbackActionKeyboard() });
    } catch (error) {
      if (error instanceof UserFacingError && error.code === "AI_LIMIT") {
        await ctx.reply(ruMessages.limitAi);
        return;
      }
      logger.error({ err: error, userId: ctx.englishFlowUser.id }, "drill command failed");
      await ctx.reply(ruMessages.aiFailed);
    }
  });
}
