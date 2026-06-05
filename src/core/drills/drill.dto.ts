import type { RepeatCheckResult } from "../practice/repeatCheck.js";
import type { FeedbackResult } from "./drill.types.js";

export type DrillDto = {
  id: string;
  sessionId: string;
  promptRu: string;
  targetWords: unknown;
  targetPatterns: unknown;
};

export type AttemptFeedbackDto = {
  attemptId: string;
  transcription: string;
  feedback: FeedbackResult;
};

export type RepeatResultDto = {
  transcription: string;
  betterVersionEn: string;
  check: RepeatCheckResult;
};

export type VoiceSubmissionDto =
  | { kind: "attempt_feedback"; result: AttemptFeedbackDto }
  | { kind: "repeat_recorded"; result: RepeatResultDto };
