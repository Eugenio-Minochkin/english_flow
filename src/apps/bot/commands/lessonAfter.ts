import type { Bot } from "grammy";
import type { LessonImportService } from "../../../core/lessons/lessonImport.service.js";
import { UserStateService } from "../../../core/state/userState.service.js";
import { prisma } from "../../../db/prisma.js";
import type { BotContext } from "../context.js";
import { ruMessages } from "../messages/ru.js";

export function registerLessonAfterCommand(bot: Bot<BotContext>, lessonImportService: LessonImportService) {
  bot.command("lesson_after", async (ctx) => {
    if (!ctx.englishFlowUser) return;
    const rawInput = ctx.message?.text.replace(/^\/lesson_after(@\w+)?\s*/i, "").trim();
    if (!rawInput) {
      await new UserStateService(prisma).set(ctx.englishFlowUser.id, "WAITING_FOR_LESSON_AFTER_INPUT", {});
      await ctx.reply(ruMessages.askLessonImportInput);
      return;
    }

    const result = await lessonImportService.importLesson(ctx.englishFlowUser.id, rawInput);
    await ctx.reply(ruMessages.lessonImportSaved(result.createdCards.length));
  });
}
