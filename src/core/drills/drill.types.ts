import type { DrillMode, DrillType, LanguageMode } from "@prisma/client";

export type GenerateDrillInput = {
  userId: string;
  type: DrillType;
};

export type GenerateTransferDrillInput = {
  userId: string;
  sourcePromptRu: string | null;
  targetAnswerEn: string;
};

export type DrillGenerationResult = {
  type: "RU_TO_EN_SPEAKING";
  prompt_ru: string;
  prompt_en: string | null;
  target_words: string[];
  target_patterns: string[];
  target_grammar: string[];
  topic: string | null;
  difficulty: string | null;
  expected_answer_notes: string | null;
  follow_up_variations: string[];
};

export type AnalyzeAttemptInput = {
  drill: {
    promptRu: string;
    targetWords: unknown;
    targetPatterns: unknown;
    targetGrammar: unknown;
    expectedAnswerNotes: string | null;
  };
  userTranscription: string;
};

export type FeedbackResult = {
  meaning_score: number;
  grammar_score: number;
  naturalness_score: number;
  meaning_ok: boolean;
  main_issue_type:
    | "russian_structure"
    | "grammar_tense"
    | "word_choice"
    | "preposition"
    | "article"
    | "connector_missing"
    | "weak_pattern"
    | "pronunciation_unclear"
    | "word_family_gap"
    | "fluency_block"
    | "no_major_issue";
  main_issue_ru: string;
  user_transcription: string;
  better_version_en: string;
  advanced_version_en: string;
  short_explanation_ru: string;
  repeat_task_ru: string;
  detected_weaknesses: unknown[];
  review_updates: unknown[];
  should_repeat_now: boolean;
};

export type CreateVocabularyCardInput = { word: string; userId: string };
export type VocabularyCardResult = {
  word: string;
  normalized_word: string;
  part_of_speech: string | null;
  meaning_en: string;
  translation_ru: string;
  ipa: string | null;
  pronunciation_hint_ru: string | null;
  examples: string[];
  collocations: string[];
  tags: string[];
  word_family: {
    verb?: string | null;
    noun?: string | null;
    adjective?: string | null;
    adverb?: string | null;
    phrases?: string[];
    examples?: string[];
  };
};
export type TransformThoughtInput = { textRu: string; userId: string };
export type ThoughtTransformResult = Record<string, unknown>;

export type TranscribeAudioInput = {
  filePath: string;
  languageMode: LanguageMode;
  mimeType?: string;
};

export type TranscriptionResult = {
  text: string;
  durationSeconds?: number;
};

export type TtsInput = { text: string; voice?: string };
export type AudioResult = { audio: Buffer; mimeType: string };

export interface SttProvider {
  transcribeAudio(input: TranscribeAudioInput): Promise<TranscriptionResult>;
}

export interface TtsProvider {
  synthesizeSpeech(input: TtsInput): Promise<AudioResult>;
}

export interface AiProvider {
  generateDrill(input: GenerateDrillInput): Promise<DrillGenerationResult>;
  generateTransferDrill(input: GenerateTransferDrillInput): Promise<DrillGenerationResult>;
  analyzeAttempt(input: AnalyzeAttemptInput): Promise<FeedbackResult>;
  createVocabularyCard(input: CreateVocabularyCardInput): Promise<VocabularyCardResult>;
  transformThought(input: TransformThoughtInput): Promise<ThoughtTransformResult>;
}

export type StartDrillResult = {
  drillId: string;
  sessionId: string;
  promptRu: string;
  mode: DrillMode;
  languageMode: LanguageMode;
};
