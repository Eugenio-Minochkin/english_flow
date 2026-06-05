import type { Bot } from "grammy";
import type { DrillService } from "../../../core/drills/drill.service.js";
import type { LessonImportService } from "../../../core/lessons/lessonImport.service.js";
import { UserStateService } from "../../../core/state/userState.service.js";
import type { VocabularyService } from "../../../core/vocabulary/vocabulary.service.js";
import { prisma } from "../../../db/prisma.js";
import { UserFacingError } from "../../../utils/errors.js";
import { logger } from "../../../utils/logger.js";
import { feedbackActionKeyboard, mainMenuLabels, scheduleSetupKeyboard } from "../keyboards/actionKeyboard.js";
import { ruMessages } from "../messages/ru.js";
import type { BotContext } from "../context.js";
import { replyWithVocabularyMenu } from "../flows/vocabularyMenu.js";

export function registerTextHandler(
  bot: Bot<BotContext>,
  drillService: DrillService,
  vocabularyService: VocabularyService,
  lessonImportService: LessonImportService,
  _scheduledRepService: unknown
) {
  const stateService = new UserStateService(prisma);

  bot.on("message:text", async (ctx) => {
    if (!ctx.englishFlowUser || ctx.message.text.startsWith("/")) return;
    const text = ctx.message.text.trim();

    if (isMainMenuText(text) && (await handleMainMenuText(ctx, text, drillService, vocabularyService, stateService))) return;

    const state = await stateService.get(ctx.englishFlowUser.id);
    if (state?.state === "WAITING_FOR_WORD_INPUT") {
      const result = await vocabularyService.createVocabularyCard(ctx.englishFlowUser.id, text);
      await stateService.reset(ctx.englishFlowUser.id);
      await ctx.reply(ruMessages.wordSaved);
      await ctx.reply(ruMessages.vocabularyCard(result.card), { parse_mode: "HTML" });
      await replyWithVocabularyMenu(ctx, vocabularyService, ctx.englishFlowUser.id);
      return;
    }

    if (state?.state === "WAITING_FOR_LESSON_AFTER_INPUT") {
      const result = await lessonImportService.importLesson(ctx.englishFlowUser.id, text);
      await stateService.reset(ctx.englishFlowUser.id);
      await ctx.reply(ruMessages.lessonImportSaved(result.createdCards.length));
      const firstCard = result.createdCards[0]?.card;
      if (firstCard) await ctx.reply(ruMessages.vocabularyCard(firstCard), { parse_mode: "HTML" });
      await replyWithVocabularyMenu(ctx, vocabularyService, ctx.englishFlowUser.id);
      return;
    }

    if (await handleMainMenuText(ctx, text, drillService, vocabularyService, stateService)) return;

    try {
      const result = await drillService.submitTextAttempt(ctx.englishFlowUser, text);
      await ctx.reply(ruMessages.feedback(result.feedback), { parse_mode: "HTML" });
    } catch (error) {
      if (error instanceof UserFacingError && error.code === "REPEAT_ACCEPTED") {
        await ctx.reply(ruMessages.repeatAcceptedText);
        return;
      }
      if (error instanceof UserFacingError && error.code === "NO_ACTIVE_DRILL") {
        await ctx.reply(ruMessages.unknownText);
        return;
      }
      throw error;
    }
  });
}

async function handleMainMenuText(
  ctx: BotContext,
  text: string,
  drillService: DrillService,
  vocabularyService: VocabularyService,
  stateService: UserStateService
) {
  if (!ctx.englishFlowUser) return false;

  if (text === mainMenuLabels.newDrill) {
    try {
      const drill = await drillService.startRuToEnDrill(ctx.englishFlowUser);
      logger.info({ userId: ctx.englishFlowUser.id, drillId: drill.drillId, sessionId: drill.sessionId }, "drill session created from menu");
      await ctx.reply(ruMessages.drillPrompt(drill.promptRu), { parse_mode: "HTML" });
      await ctx.reply(ruMessages.sendVoiceAnswer, { parse_mode: "HTML", reply_markup: feedbackActionKeyboard() });
    } catch (error) {
      await ctx.reply(error instanceof UserFacingError && error.code === "AI_LIMIT" ? ruMessages.limitAi : ruMessages.aiFailed);
    }
    return true;
  }

  if (text === mainMenuLabels.schedule) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: ctx.englishFlowUser.id } });
    await ctx.reply(
      ruMessages.scheduleSetup({
        count: user.dailyDrillCount,
        windows: readScheduleWindows(user.scheduleWindows),
        quietHoursStart: user.quietHoursStart,
        quietHoursEnd: user.quietHoursEnd
      }),
      { parse_mode: "HTML", reply_markup: scheduleSetupKeyboard() }
    );
    return true;
  }

  if (text === mainMenuLabels.words) {
    await replyWithVocabularyMenu(ctx, vocabularyService, ctx.englishFlowUser.id);
    return true;
  }

  if (text === mainMenuLabels.review) {
    const drill = (await drillService.startPracticeDrill(ctx.englishFlowUser)) ?? (await drillService.startVocabularyDrill(ctx.englishFlowUser));
    if (!drill) {
      await ctx.reply(ruMessages.noPracticeOrVocabularyForReview);
      return true;
    }
    await ctx.reply(ruMessages.drillPrompt(drill.promptRu), { parse_mode: "HTML" });
    await ctx.reply(ruMessages.sendVoiceAnswer, { parse_mode: "HTML", reply_markup: feedbackActionKeyboard() });
    return true;
  }

  if (text === mainMenuLabels.lessonImport) {
    await stateService.set(ctx.englishFlowUser.id, "WAITING_FOR_LESSON_AFTER_INPUT", {});
    await ctx.reply(ruMessages.askLessonImportInput);
    return true;
  }

  if (text === mainMenuLabels.stats) {
    await ctx.reply(ruMessages.statsComingSoon);
    return true;
  }

  if (text === mainMenuLabels.settings) {
    await ctx.reply(ruMessages.settingsComingSoon);
    return true;
  }

  return false;
}

export function readScheduleWindows(value: unknown): string[] {
  if (!Array.isArray(value)) return ["morning", "afternoon", "evening"];
  const windows = value.filter((item): item is string => typeof item === "string");
  return windows.length ? windows : ["morning", "afternoon", "evening"];
}

export function isMainMenuText(text: string) {
  return Object.values(mainMenuLabels).includes(text);
}
