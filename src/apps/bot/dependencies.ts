import { Bot } from "grammy";
import { prisma } from "../../db/prisma.js";
import { env } from "../../utils/env.js";
import { createOpenAiClient } from "../../integrations/openai/openaiClient.js";
import { OpenAiProvider } from "../../integrations/openai/openaiAiProvider.js";
import { DeepgramSttProvider } from "../../integrations/deepgram/deepgramSttProvider.js";
import { MockAiProvider } from "../../integrations/mocks/mockAiProvider.js";
import { MockSttProvider } from "../../integrations/mocks/mockSttProvider.js";
import { UserService } from "../../core/users/user.service.js";
import { DrillService } from "../../core/drills/drill.service.js";
import { ScheduledRepService } from "../../core/scheduling/scheduledRep.service.js";
import { VocabularyService } from "../../core/vocabulary/vocabulary.service.js";
import { LessonImportService } from "../../core/lessons/lessonImport.service.js";
import { TelegramFileService } from "../../integrations/telegram/telegramFile.service.js";
import type { BotContext } from "./context.js";

export function createBotDependencies(bot: Bot<BotContext>) {
  const useMocks = env.NODE_ENV !== "production" && (!env.OPENAI_API_KEY || !env.DEEPGRAM_API_KEY);
  const aiProvider = useMocks ? new MockAiProvider() : new OpenAiProvider(createOpenAiClient());
  const sttProvider = useMocks ? new MockSttProvider() : new DeepgramSttProvider();
  const vocabularyService = new VocabularyService(prisma, aiProvider);
  return {
    prisma,
    userService: new UserService(prisma),
    drillService: new DrillService(prisma, aiProvider, sttProvider),
    scheduledRepService: new ScheduledRepService(prisma),
    vocabularyService,
    lessonImportService: new LessonImportService(prisma, vocabularyService),
    telegramFileService: new TelegramFileService(bot)
  };
}
