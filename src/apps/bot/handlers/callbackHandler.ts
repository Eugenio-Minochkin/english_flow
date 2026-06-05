import type { Bot } from "grammy";
import type { DrillService } from "../../../core/drills/drill.service.js";
import type { ScheduledRepService } from "../../../core/scheduling/scheduledRep.service.js";
import { UserStateService } from "../../../core/state/userState.service.js";
import { prisma } from "../../../db/prisma.js";
import { UserFacingError } from "../../../utils/errors.js";
import { logger } from "../../../utils/logger.js";
import {
  feedbackActionKeyboard,
  actionCallbacks,
  parseScheduleSetupCallback,
  parseScheduledRepCallback,
  scheduleSetupKeyboard
} from "../keyboards/actionKeyboard.js";
import { ruMessages } from "../messages/ru.js";
import type { BotContext } from "../context.js";
import { readScheduleWindows } from "./textHandler.js";

export function isExpiredCallbackQueryError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("query is too old") || message.includes("response timeout expired") || message.includes("query ID is invalid");
}

async function answerCallbackSafely(ctx: BotContext, options?: Parameters<BotContext["answerCallbackQuery"]>[0]) {
  try {
    await ctx.answerCallbackQuery(options);
  } catch (error) {
    if (!isExpiredCallbackQueryError(error)) throw error;
    logger.warn({ updateId: ctx.update.update_id }, "callback query answer expired; continuing action");
  }
}

export function registerCallbackHandler(bot: Bot<BotContext>, drillService: DrillService, scheduledRepService: ScheduledRepService) {
  bot.on("callback_query:data", async (ctx) => {
    if (!ctx.englishFlowUser) return;
    const data = ctx.callbackQuery.data;
    const scheduled = parseScheduledRepCallback(data);
    if (scheduled?.action === "start") {
      await answerCallbackSafely(ctx);
      try {
        await scheduledRepService.startRep(scheduled.repId, "VOICE");
        const drill = await drillService.startRuToEnDrill(ctx.englishFlowUser, { scheduledRepId: scheduled.repId });
        await scheduledRepService.attachDrill(scheduled.repId, drill.drillId);
        logger.info({ userId: ctx.englishFlowUser.id, drillId: drill.drillId, sessionId: drill.sessionId, scheduledRepId: scheduled.repId }, "scheduled drill started");
        await ctx.reply(ruMessages.drillPrompt(drill.promptRu), { parse_mode: "HTML" });
        await ctx.reply(ruMessages.sendVoiceAnswer, { parse_mode: "HTML", reply_markup: feedbackActionKeyboard() });
      } catch (error) {
        logger.error({ err: error, userId: ctx.englishFlowUser.id, scheduledRepId: scheduled.repId }, "scheduled drill start failed");
        await ctx.reply(error instanceof UserFacingError && error.code === "AI_LIMIT" ? ruMessages.limitAi : ruMessages.aiFailed);
      }
      return;
    }
    if (scheduled?.action === "text_mode") {
      await answerCallbackSafely(ctx);
      try {
        await scheduledRepService.enableTextMode(scheduled.repId);
        const drill = await drillService.startRuToEnDrill(ctx.englishFlowUser, { mode: "TEXT", scheduledRepId: scheduled.repId });
        await scheduledRepService.attachDrill(scheduled.repId, drill.drillId);
        await ctx.reply(ruMessages.scheduledRepTextMode);
        await ctx.reply(ruMessages.drillPrompt(drill.promptRu), { parse_mode: "HTML" });
      } catch (error) {
        logger.error({ err: error, userId: ctx.englishFlowUser.id, scheduledRepId: scheduled.repId }, "scheduled text drill start failed");
        await ctx.reply(error instanceof UserFacingError && error.code === "AI_LIMIT" ? ruMessages.limitAi : ruMessages.aiFailed);
      }
      return;
    }
    if (scheduled?.action === "snooze") {
      await answerCallbackSafely(ctx);
      await scheduledRepService.snoozeRep(scheduled.repId, 30);
      await ctx.reply(ruMessages.scheduledRepSnoozed);
      return;
    }
    if (scheduled?.action === "skip") {
      await answerCallbackSafely(ctx);
      await scheduledRepService.skipRep(scheduled.repId);
      await ctx.reply(ruMessages.scheduledRepSkipped);
      return;
    }

    const scheduleSetup = parseScheduleSetupCallback(data);
    if (scheduleSetup) {
      await answerCallbackSafely(ctx);
      const user = await prisma.user.findUniqueOrThrow({ where: { id: ctx.englishFlowUser.id } });
      let windows = readScheduleWindows(user.scheduleWindows);
      const updateData: { dailyDrillCount?: number; firstWeekDrillCount?: number; scheduleWindows?: string[] } = {};

      if (scheduleSetup.action === "count" && scheduleSetup.value) {
        const count = Number(scheduleSetup.value);
        if (count === 3 || count === 5) {
          updateData.dailyDrillCount = count;
          updateData.firstWeekDrillCount = count;
        }
      }

      if (scheduleSetup.action === "window" && scheduleSetup.value) {
        const allowed = ["morning", "afternoon", "evening"];
        if (allowed.includes(scheduleSetup.value)) {
          windows = windows.includes(scheduleSetup.value)
            ? windows.filter((window) => window !== scheduleSetup.value)
            : [...windows, scheduleSetup.value];
          if (windows.length === 0) windows = ["morning", "afternoon", "evening"];
          updateData.scheduleWindows = windows;
        }
      }

      const updated = Object.keys(updateData).length
        ? await prisma.user.update({ where: { id: ctx.englishFlowUser.id }, data: updateData })
        : user;

      if (scheduleSetup.action === "save") await ctx.reply(ruMessages.scheduleSaved);
      await ctx.reply(
        ruMessages.scheduleSetup({
          count: updated.dailyDrillCount,
          windows: readScheduleWindows(updated.scheduleWindows),
          quietHoursStart: updated.quietHoursStart,
          quietHoursEnd: updated.quietHoursEnd
        }),
        { parse_mode: "HTML", reply_markup: scheduleSetupKeyboard() }
      );
      return;
    }

    if (data === actionCallbacks.newDrill) {
      await answerCallbackSafely(ctx);
      try {
        const drill = await drillService.startRuToEnDrill(ctx.englishFlowUser);
        logger.info({ userId: ctx.englishFlowUser.id, drillId: drill.drillId, sessionId: drill.sessionId }, "drill session created from callback");
        await ctx.reply(ruMessages.drillPrompt(drill.promptRu), { parse_mode: "HTML" });
        await ctx.reply(ruMessages.sendVoiceAnswer, { parse_mode: "HTML", reply_markup: feedbackActionKeyboard() });
      } catch (error) {
        if (error instanceof UserFacingError && error.code === "AI_LIMIT") {
          await ctx.reply(ruMessages.limitAi);
          return;
        }
        logger.error({ err: error, userId: ctx.englishFlowUser.id }, "callback drill start failed");
        await ctx.reply(ruMessages.aiFailed);
      }
      return;
    }
    if (data === actionCallbacks.repeat) {
      await answerCallbackSafely(ctx, { text: ruMessages.callbackSendVoiceRepeat });
      await ctx.reply(ruMessages.repeatHint, { parse_mode: "HTML" });
      return;
    }
    if (data === actionCallbacks.stop) {
      await new UserStateService(prisma).reset(ctx.englishFlowUser.id);
      await answerCallbackSafely(ctx);
      await ctx.reply(ruMessages.stopped);
      return;
    }
    await answerCallbackSafely(ctx, { text: ruMessages.callbackUnknownAction });
  });
}
