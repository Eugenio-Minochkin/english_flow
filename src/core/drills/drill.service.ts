import { unlink } from "node:fs/promises";
import type { DrillSession, PrismaClient, User, VocabularyItem } from "@prisma/client";
import type { AiProvider, SttProvider } from "./drill.types.js";
import type { AttemptFeedbackDto, RepeatResultDto, VoiceSubmissionDto } from "./drill.dto.js";
import { env } from "../../utils/env.js";
import { canSubmitVoiceToday, canUseAiToday } from "../../utils/costLimits.js";
import { UserFacingError } from "../../utils/errors.js";
import { FEEDBACK_PROMPT, DRILL_GENERATION_PROMPT, TRANSFER_DRILL_PROMPT } from "../../integrations/openai/prompts.js";
import { feedbackSchema } from "../../integrations/openai/schemas.js";
import { UserStateService } from "../state/userState.service.js";
import { EventService } from "../events/event.service.js";
import { VocabularyService } from "../vocabulary/vocabulary.service.js";
import { PracticeItemService } from "../practice/practiceItem.service.js";
import { compareRepeatToTarget } from "../practice/repeatCheck.js";
import { logger } from "../../utils/logger.js";

export class DrillService {
  private readonly stateService: UserStateService;
  private readonly eventService: EventService;
  private readonly vocabularyService: VocabularyService;
  private readonly practiceItemService: PracticeItemService;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly aiProvider: AiProvider,
    private readonly sttProvider: SttProvider
  ) {
    this.stateService = new UserStateService(prisma);
    this.eventService = new EventService(prisma);
    this.vocabularyService = new VocabularyService(prisma, aiProvider);
    this.practiceItemService = new PracticeItemService(prisma);
  }

  async startRuToEnDrill(user: User, options: { mode?: "VOICE" | "TEXT"; scheduledRepId?: string } = {}) {
    const aiLimit = await canUseAiToday(this.prisma, user.id);
    if (!aiLimit.allowed) throw new UserFacingError("AI limit exceeded", "AI_LIMIT");

    const generated = await this.aiProvider.generateDrill({ userId: user.id, type: "RU_TO_EN_SPEAKING" });
    await this.prisma.aiLog.create({
      data: {
        userId: user.id,
        purpose: "drill_generation",
        promptName: DRILL_GENERATION_PROMPT.name,
        promptVersion: DRILL_GENERATION_PROMPT.version,
        inputSummary: "RU_TO_EN_SPEAKING drill generation",
        outputJson: generated as object,
        validationStatus: "valid",
        model: env.OPENAI_MODEL
      }
    });
    await this.prisma.usageLog.create({
      data: { userId: user.id, provider: "openai", operation: "generate_drill", units: 1 }
    });

    const drill = await this.prisma.drill.create({
      data: {
        userId: user.id,
        type: "RU_TO_EN_SPEAKING",
        promptRu: generated.prompt_ru,
        promptEn: generated.prompt_en,
        targetWords: generated.target_words,
        targetPatterns: generated.target_patterns,
        targetGrammar: generated.target_grammar,
        topic: generated.topic,
        difficulty: generated.difficulty,
        source: "ai",
        expectedAnswerNotes: generated.expected_answer_notes
      }
    });
    const session = await this.prisma.drillSession.create({
      data: {
        userId: user.id,
        drillId: drill.id,
        mode: options.mode ?? "VOICE",
        languageMode: "ENGLISH_SPEECH",
        scheduledRepId: options.scheduledRepId,
        status: "ACTIVE",
        startedAt: new Date()
      }
    });
    await this.stateService.set(user.id, "WAITING_FOR_DRILL_ANSWER", { sessionId: session.id }, new Date(Date.now() + 30 * 60_000));
    await this.eventService.record("DRILL_STARTED", user.id, { drillId: drill.id, sessionId: session.id });
    return { drillId: drill.id, sessionId: session.id, promptRu: drill.promptRu, mode: session.mode, languageMode: session.languageMode };
  }

  async startScheduledDrill(user: User, options: { mode?: "VOICE" | "TEXT"; scheduledRepId?: string } = {}) {
    const practiceDrill = await this.startPracticeDrill(user, options);
    if (practiceDrill) return practiceDrill;
    const vocabularyDrill = await this.startVocabularyDrill(user, options);
    if (vocabularyDrill) return vocabularyDrill;
    return this.startRuToEnDrill(user, options);
  }

  async startVocabularyDrill(user: User, options: { mode?: "VOICE" | "TEXT"; scheduledRepId?: string } = {}) {
    const vocabularyItem = await this.vocabularyService.pickDueVocabularyItem(user.id);
    if (!vocabularyItem) return null;

    const promptRu = buildVocabularyPrompt(vocabularyItem);
    const drill = await this.prisma.drill.create({
      data: {
        userId: user.id,
        type: "VOCABULARY_IN_SPEECH",
        promptRu,
        promptEn: null,
        targetWords: [vocabularyItem.normalizedWord],
        targetPatterns: jsonStringArray(vocabularyItem.collocations),
        targetGrammar: [],
        topic: "vocabulary",
        difficulty: null,
        source: "vocabulary",
        expectedAnswerNotes: `Use the target word naturally: ${vocabularyItem.normalizedWord}. Meaning: ${vocabularyItem.meaningEn}`
      }
    });
    const session = await this.prisma.drillSession.create({
      data: {
        userId: user.id,
        drillId: drill.id,
        mode: options.mode ?? "VOICE",
        languageMode: "ENGLISH_SPEECH",
        scheduledRepId: options.scheduledRepId,
        status: "ACTIVE",
        startedAt: new Date()
      }
    });
    await this.stateService.set(user.id, "WAITING_FOR_DRILL_ANSWER", { sessionId: session.id, vocabularyItemId: vocabularyItem.id }, new Date(Date.now() + 30 * 60_000));
    await this.eventService.record("VOCABULARY_DRILL_STARTED", user.id, { drillId: drill.id, sessionId: session.id, vocabularyItemId: vocabularyItem.id });
    return { drillId: drill.id, sessionId: session.id, promptRu: drill.promptRu, mode: session.mode, languageMode: session.languageMode };
  }

  async startPracticeDrill(user: User, options: { mode?: "VOICE" | "TEXT"; scheduledRepId?: string } = {}) {
    const practiceItem = await this.practiceItemService.pickDuePracticeItem(user.id);
    if (!practiceItem) return null;
    const targetAnswerEn = practiceItem.targetAnswerEn || practiceItem.betterVersionEn || "";
    const promptRu = buildPracticePrompt(practiceItem.promptRu, targetAnswerEn);
    const drill = await this.prisma.drill.create({
      data: {
        userId: user.id,
        type: "REVIEW",
        promptRu,
        promptEn: targetAnswerEn || null,
        targetWords: [],
        targetPatterns: targetAnswerEn ? [targetAnswerEn] : [],
        targetGrammar: [],
        topic: "practice",
        difficulty: null,
        source: "practice_item",
        expectedAnswerNotes: targetAnswerEn ? `Try to use this target answer: ${targetAnswerEn}` : null
      }
    });
    const session = await this.prisma.drillSession.create({
      data: {
        userId: user.id,
        drillId: drill.id,
        mode: options.mode ?? "VOICE",
        languageMode: "ENGLISH_SPEECH",
        scheduledRepId: options.scheduledRepId,
        status: "ACTIVE",
        startedAt: new Date()
      }
    });
    await this.stateService.set(user.id, "WAITING_FOR_DRILL_ANSWER", { sessionId: session.id, practiceItemId: practiceItem.id }, new Date(Date.now() + 30 * 60_000));
    await this.eventService.record("PRACTICE_DRILL_STARTED", user.id, { drillId: drill.id, sessionId: session.id, practiceItemId: practiceItem.id });
    return { drillId: drill.id, sessionId: session.id, promptRu: drill.promptRu, mode: session.mode, languageMode: session.languageMode };
  }

  async submitVoiceAttempt(user: User, voiceFileId: string, audioPath: string): Promise<AttemptFeedbackDto> {
    const result = await this.submitVoiceMessage(user, voiceFileId, audioPath);
    if (result.kind !== "attempt_feedback") {
      throw new UserFacingError("Expected active drill answer", "NO_ACTIVE_DRILL");
    }
    return result.result;
  }

  async submitVoiceMessage(user: User, voiceFileId: string, audioPath: string): Promise<VoiceSubmissionDto> {
    const voiceLimit = await canSubmitVoiceToday(this.prisma, user.id);
    if (!voiceLimit.allowed) throw new UserFacingError("Voice limit exceeded", "VOICE_LIMIT");

    let transcription = "";
    try {
      const state = await this.stateService.get(user.id);
      if (state?.state === "WAITING_FOR_REPEAT") {
        const repeat = await this.submitRepeatVoice(user, audioPath, state.payload);
        return { kind: "repeat_recorded", result: repeat };
      }
      const session = await this.getActiveSessionFromState(user.id);
      const result = await this.sttProvider.transcribeAudio({ filePath: audioPath, languageMode: session.languageMode });
      transcription = result.text;
      await this.prisma.usageLog.create({
        data: { userId: user.id, provider: "deepgram", operation: "stt", units: Math.ceil(result.durationSeconds ?? 1) }
      });
      const attempt = await this.submitTranscribedAttempt(user, session, transcription, voiceFileId);
      return { kind: "attempt_feedback", result: attempt };
    } finally {
      await unlink(audioPath).catch(() => undefined);
    }
  }

  async submitTextAttempt(user: User, text: string): Promise<AttemptFeedbackDto> {
    const state = await this.stateService.get(user.id);
    if (state?.state === "WAITING_FOR_REPEAT") {
      await this.stateService.reset(user.id);
      throw new UserFacingError("Repeat accepted", "REPEAT_ACCEPTED");
    }
    const session = await this.getActiveSessionFromState(user.id);
    return this.submitTranscribedAttempt(user, session, text);
  }

  private async submitRepeatVoice(user: User, audioPath: string, payload: unknown): Promise<RepeatResultDto> {
    const repeatPayload = payload as { betterVersionEn?: string; practiceItemId?: string; canStartTransfer?: boolean } | null;
    const result = await this.sttProvider.transcribeAudio({ filePath: audioPath, languageMode: "ENGLISH_SPEECH" });
    await this.prisma.usageLog.create({
      data: { userId: user.id, provider: "deepgram", operation: "repeat_stt", units: Math.ceil(result.durationSeconds ?? 1) }
    });
    const betterVersionEn = repeatPayload?.betterVersionEn ?? "";
    const check = compareRepeatToTarget(result.text, betterVersionEn);
    let practiceItem: { promptRu?: string | null } | null = null;
    if (repeatPayload?.practiceItemId) {
      practiceItem = await this.practiceItemService.scheduleAfterResult(repeatPayload.practiceItemId, check.success ? "success" : "fail");
    }
    await this.stateService.reset(user.id);
    const transferDrill =
      check.success && betterVersionEn && repeatPayload?.canStartTransfer !== false
        ? await this.tryStartTransferDrill(user, {
            sourcePromptRu: practiceItem?.promptRu ?? null,
            targetAnswerEn: betterVersionEn
          })
        : null;
    await this.eventService.record("DRILL_REPEAT_SUBMITTED", user.id, { transcriptionPresent: Boolean(result.text), repeatScore: check.score, repeatSuccess: check.success });
    return {
      transcription: result.text,
      betterVersionEn,
      check,
      transferDrill
    };
  }

  private async tryStartTransferDrill(user: User, input: { sourcePromptRu: string | null; targetAnswerEn: string }) {
    try {
      return await this.startTransferDrill(user, input);
    } catch (error) {
      logger.warn(
        {
          userId: user.id,
          errorName: error instanceof Error ? error.name : undefined,
          errorMessage: error instanceof Error ? error.message : String(error)
        },
        "transfer drill generation skipped"
      );
      return null;
    }
  }

  private async startTransferDrill(user: User, input: { sourcePromptRu: string | null; targetAnswerEn: string }) {
    const aiLimit = await canUseAiToday(this.prisma, user.id);
    if (!aiLimit.allowed) return null;

    const generated = await this.aiProvider.generateTransferDrill({
      userId: user.id,
      sourcePromptRu: input.sourcePromptRu,
      targetAnswerEn: input.targetAnswerEn
    });
    await this.prisma.aiLog.create({
      data: {
        userId: user.id,
        purpose: "transfer_drill_generation",
        promptName: TRANSFER_DRILL_PROMPT.name,
        promptVersion: TRANSFER_DRILL_PROMPT.version,
        inputSummary: "Transfer drill generation after successful repeat",
        outputJson: generated as object,
        validationStatus: "valid",
        model: env.OPENAI_MODEL
      }
    });
    await this.prisma.usageLog.create({
      data: { userId: user.id, provider: "openai", operation: "generate_transfer_drill", units: 1 }
    });

    const targetConstruction = generated.target_patterns[0] ?? generated.prompt_en ?? generated.expected_answer_notes ?? input.targetAnswerEn;
    const drill = await this.prisma.drill.create({
      data: {
        userId: user.id,
        type: "RU_TO_EN_SPEAKING",
        promptRu: buildTransferPrompt(generated.prompt_ru, targetConstruction),
        promptEn: generated.prompt_en,
        targetWords: generated.target_words,
        targetPatterns: generated.target_patterns.length ? generated.target_patterns : [input.targetAnswerEn],
        targetGrammar: generated.target_grammar,
        topic: generated.topic,
        difficulty: generated.difficulty,
        source: "transfer",
        expectedAnswerNotes: generated.expected_answer_notes ?? `Use the same pattern as: ${input.targetAnswerEn}`
      }
    });
    const session = await this.prisma.drillSession.create({
      data: {
        userId: user.id,
        drillId: drill.id,
        mode: "VOICE",
        languageMode: "ENGLISH_SPEECH",
        status: "ACTIVE",
        startedAt: new Date()
      }
    });
    await this.stateService.set(user.id, "WAITING_FOR_DRILL_ANSWER", { sessionId: session.id, isTransfer: true }, new Date(Date.now() + 30 * 60_000));
    await this.eventService.record("TRANSFER_DRILL_STARTED", user.id, { drillId: drill.id, sessionId: session.id });
    return { drillId: drill.id, sessionId: session.id, promptRu: drill.promptRu, mode: session.mode, languageMode: session.languageMode };
  }

  private async submitTranscribedAttempt(user: User, session: DrillSession, transcription: string, voiceFileId?: string): Promise<AttemptFeedbackDto> {
    const aiLimit = await canUseAiToday(this.prisma, user.id);
    if (!aiLimit.allowed) throw new UserFacingError("AI limit exceeded", "AI_LIMIT");

    const drill = await this.prisma.drill.findUniqueOrThrow({ where: { id: session.drillId } });
    const attempt = await this.prisma.attempt.create({
      data: {
        userId: user.id,
        drillSessionId: session.id,
        voiceFileId,
        userText: voiceFileId ? undefined : transcription,
        transcription,
        feedbackJson: null as never
      }
    });

    const analyzeInput = {
      drill: {
        promptRu: drill.promptRu,
        targetWords: drill.targetWords,
        targetPatterns: drill.targetPatterns,
        targetGrammar: drill.targetGrammar,
        expectedAnswerNotes: drill.expectedAnswerNotes
      },
      userTranscription: transcription
    };
    const feedback = await this.aiProvider.analyzeAttempt(analyzeInput);
    const parsed = feedbackSchema.safeParse(feedback);
    if (!parsed.success) {
      await this.prisma.aiLog.create({
        data: {
          userId: user.id,
          purpose: "attempt_feedback",
          promptName: FEEDBACK_PROMPT.name,
          promptVersion: FEEDBACK_PROMPT.version,
          inputSummary: `Feedback for drillSession=${session.id}`,
          outputJson: feedback as object,
          validationStatus: "invalid",
          model: env.OPENAI_MODEL
        }
      });
      const retryFeedback = await this.aiProvider.analyzeAttempt(analyzeInput);
      const retryParsed = feedbackSchema.safeParse(retryFeedback);
      if (!retryParsed.success) {
        await this.prisma.aiLog.create({
          data: {
            userId: user.id,
            purpose: "attempt_feedback",
            promptName: FEEDBACK_PROMPT.name,
            promptVersion: FEEDBACK_PROMPT.version,
            inputSummary: `Feedback retry for drillSession=${session.id}`,
            outputJson: retryFeedback as object,
            validationStatus: "invalid",
            model: env.OPENAI_MODEL
          }
        });
        throw retryParsed.error;
      }
      return this.saveValidatedFeedback(user, session, drill, attempt.id, transcription, retryParsed.data);
    }
    const validated = parsed.data;
    return this.saveValidatedFeedback(user, session, drill, attempt.id, transcription, validated);
  }

  private async saveValidatedFeedback(
    user: User,
    session: DrillSession,
    drill: Awaited<ReturnType<PrismaClient["drill"]["findUniqueOrThrow"]>>,
    attemptId: string,
    transcription: string,
    validated: ReturnType<typeof feedbackSchema.parse>
  ): Promise<AttemptFeedbackDto> {
    await this.prisma.aiLog.create({
      data: {
        userId: user.id,
        purpose: "attempt_feedback",
        promptName: FEEDBACK_PROMPT.name,
        promptVersion: FEEDBACK_PROMPT.version,
        inputSummary: `Feedback for drillSession=${session.id}`,
        outputJson: validated as object,
        validationStatus: "valid",
        model: env.OPENAI_MODEL
      }
    });
    await this.prisma.usageLog.create({
      data: { userId: user.id, provider: "openai", operation: "analyze_attempt", units: 1 }
    });

    const attempt = await this.prisma.attempt.update({
      where: { id: attemptId },
      data: {
        transcription,
        feedbackJson: validated as object,
        meaningScore: validated.meaning_score,
        grammarScore: validated.grammar_score,
        naturalnessScore: validated.naturalness_score
      }
    });
    const practiceItem = await this.practiceItemService.createFromFeedback({
      userId: user.id,
      attemptId: attempt.id,
      drill: { promptRu: drill.promptRu },
      feedback: validated
    });
    if (drill.source === "vocabulary") {
      const targetWords = Array.isArray(drill.targetWords) ? drill.targetWords.filter((value): value is string => typeof value === "string") : [];
      const targetWord = targetWords[0];
      if (targetWord) await this.vocabularyService.scheduleNextReviewByWord(user.id, targetWord);
    }
    await this.prisma.drillSession.update({
      where: { id: session.id },
      data: { status: "COMPLETED", completedAt: new Date() }
    });
    if (session.scheduledRepId) {
      await this.prisma.scheduledRep.update({ where: { id: session.scheduledRepId }, data: { status: "COMPLETED" } });
    }
    await this.stateService.set(
      user.id,
      "WAITING_FOR_REPEAT",
      { sessionId: session.id, practiceItemId: practiceItem.id, betterVersionEn: validated.better_version_en, canStartTransfer: drill.source !== "transfer" },
      new Date(Date.now() + 30 * 60_000)
    );
    await this.eventService.record("ATTEMPT_SUBMITTED", user.id, { attemptId: attempt.id, sessionId: session.id });
    await this.eventService.record("FEEDBACK_GENERATED", user.id, { attemptId: attempt.id });
    return { attemptId: attempt.id, transcription, feedback: validated };
  }

  private async getActiveSessionFromState(userId: string) {
    const state = await this.stateService.get(userId);
    const payload = state?.payload as { sessionId?: string } | null;
    if (state?.state !== "WAITING_FOR_DRILL_ANSWER" || !payload?.sessionId) {
      throw new UserFacingError("No active drill", "NO_ACTIVE_DRILL");
    }
    return this.prisma.drillSession.findFirstOrThrow({
      where: { id: payload.sessionId, userId, status: "ACTIVE" }
    });
  }
}

function buildVocabularyPrompt(item: VocabularyItem) {
  const examples = Array.isArray(item.examples) ? item.examples.filter((value): value is string => typeof value === "string") : [];
  const exampleHint = examples[0] ? ` Пример: ${examples[0]}` : "";
  return [
    `Скажи по-английски 1-2 предложения и обязательно используй слово «${item.normalizedWord}».`,
    "",
    `Смысл слова: ${item.translationRu}.`,
    `Ситуация: расскажи что-то из работы, AI-проекта, общения или планов.${exampleHint}`
  ].join("\n");
}

function buildPracticePrompt(promptRu: string | null, targetAnswerEn: string) {
  if (promptRu) {
    return [
      "Идея:",
      `«${promptRu}»`,
      "",
      "Целевая конструкция:",
      targetAnswerEn,
      "",
      "Ответь голосом по-английски."
    ]
      .filter(Boolean)
      .join("\n");
  }
  return ["Целевая конструкция:", targetAnswerEn, "", "Ответь голосом по-английски."].filter(Boolean).join("\n");
}

function buildTransferPrompt(promptRu: string, targetConstruction: string) {
  return [
    "Теперь применим это в новой ситуации.",
    "",
    "Идея:",
    `«${promptRu}»`,
    "",
    "Целевая конструкция:",
    targetConstruction,
    "",
    "Ответь голосом по-английски."
  ].join("\n");
}

function jsonStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}
