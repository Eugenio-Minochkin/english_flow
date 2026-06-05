import type { Bot } from "grammy";
import type { DrillService } from "../../../core/drills/drill.service.js";
import type { TelegramFileService } from "../../../integrations/telegram/telegramFile.service.js";
import { env } from "../../../utils/env.js";
import { UserFacingError } from "../../../utils/errors.js";
import { logger } from "../../../utils/logger.js";
import { feedbackActionKeyboard, mainActionKeyboard } from "../keyboards/actionKeyboard.js";
import { ruMessages } from "../messages/ru.js";
import type { BotContext } from "../context.js";

export function isVoiceTooLong(durationSeconds: number | undefined, maxSeconds: number) {
  return typeof durationSeconds === "number" && durationSeconds > maxSeconds;
}

export function registerVoiceHandler(bot: Bot<BotContext>, drillService: DrillService, fileService: TelegramFileService) {
  bot.on("message:voice", async (ctx) => {
    if (!ctx.englishFlowUser) return;
    const voice = ctx.message.voice;
    if (isVoiceTooLong(voice.duration, env.MAX_AUDIO_DURATION_SECONDS)) {
      await ctx.reply(ruMessages.voiceTooLong(voice.duration, env.MAX_AUDIO_DURATION_SECONDS));
      return;
    }
    logger.info({ userId: ctx.englishFlowUser.id, telegramId: ctx.from?.id, fileIdPresent: Boolean(voice.file_id) }, "voice message received");
    try {
      const audioPath = await fileService.downloadFile(voice.file_id);
      const submission = await drillService.submitVoiceMessage(ctx.englishFlowUser, voice.file_id, audioPath);
      if (submission.kind === "repeat_recorded") {
        await ctx.reply(
          submission.result.check.success
            ? ruMessages.repeatCheckSuccess
            : ruMessages.repeatCheckFail(submission.result.check.missingWords, submission.result.betterVersionEn),
          {
          parse_mode: "HTML",
          reply_markup: mainActionKeyboard()
          }
        );
        return;
      }
      await ctx.reply(ruMessages.feedback(submission.result.feedback), {
        parse_mode: "HTML",
        reply_markup: feedbackActionKeyboard()
      });
    } catch (error) {
      if (error instanceof UserFacingError) {
        if (error.code === "NO_ACTIVE_DRILL") await ctx.reply(ruMessages.noActiveDrill);
        else if (error.code === "AI_LIMIT") await ctx.reply(ruMessages.limitAi);
        else if (error.code === "VOICE_LIMIT") await ctx.reply(ruMessages.limitVoice);
        else await ctx.reply(ruMessages.genericError);
        return;
      }
      const message = error instanceof Error ? error.message : String(error);
      const isAiError = message.includes("response_format") || message.includes("OpenAI") || message.includes("api.openai.com");
      logger.error(
        {
          errorName: error instanceof Error ? error.name : undefined,
          errorMessage: message,
          userId: ctx.englishFlowUser.id
        },
        "voice handling failed"
      );
      await ctx.reply(isAiError ? ruMessages.aiFailed : ruMessages.sttFailed);
    }
  });
}
