import { unlink } from "node:fs/promises";
import type { DrillSession, PrismaClient, User } from "@prisma/client";
import type { AiProvider, SttProvider } from "./drill.types.js";
import type { AttemptFeedbackDto, RepeatResultDto, VoiceSubmissionDto } from "./drill.dto.js";
import { env } from "../../utils/env.js";
import { canSubmitVoiceToday, canUseAiToday } from "../../utils/costLimits.js";
import { UserFacingError } from "../../utils/errors.js";
import { FEEDBACK_PROMPT, DRILL_GENERATION_PROMPT } from "../../integrations/openai/prompts.js";
import { feedbackSchema } from "../../integrations/openai/schemas.js";
import { UserStateService } from "../state/userState.service.js";
import { EventService } from "../events/event.service.js";

export class DrillService {
  private readonly stateService: UserStateService;
  private readonly eventService: EventService;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly aiProvider: AiProvider,
    private readonly sttProvider: SttProvider
  ) {
    this.stateService = new UserStateService(prisma);
    this.eventService = new EventService(prisma);
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
    const repeatPayload = payload as { betterVersionEn?: string } | null;
    const result = await this.sttProvider.transcribeAudio({ filePath: audioPath, languageMode: "ENGLISH_SPEECH" });
    await this.prisma.usageLog.create({
      data: { userId: user.id, provider: "deepgram", operation: "repeat_stt", units: Math.ceil(result.durationSeconds ?? 1) }
    });
    await this.stateService.reset(user.id);
    await this.eventService.record("DRILL_REPEAT_SUBMITTED", user.id, { transcriptionPresent: Boolean(result.text) });
    return {
      transcription: result.text,
      betterVersionEn: repeatPayload?.betterVersionEn ?? ""
    };
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
      return this.saveValidatedFeedback(user, session, attempt.id, transcription, retryParsed.data);
    }
    const validated = parsed.data;
    return this.saveValidatedFeedback(user, session, attempt.id, transcription, validated);
  }

  private async saveValidatedFeedback(
    user: User,
    session: DrillSession,
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
    await this.prisma.drillSession.update({
      where: { id: session.id },
      data: { status: "COMPLETED", completedAt: new Date() }
    });
    await this.stateService.set(user.id, "WAITING_FOR_REPEAT", { sessionId: session.id, betterVersionEn: validated.better_version_en }, new Date(Date.now() + 30 * 60_000));
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
