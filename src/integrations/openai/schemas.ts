import { z } from "zod";

export const feedbackSchema = z.object({
  meaning_score: z.number().min(1).max(10),
  grammar_score: z.number().min(1).max(10),
  naturalness_score: z.number().min(1).max(10),
  meaning_ok: z.boolean(),
  main_issue_type: z.enum([
    "russian_structure",
    "grammar_tense",
    "word_choice",
    "preposition",
    "article",
    "connector_missing",
    "weak_pattern",
    "pronunciation_unclear",
    "word_family_gap",
    "fluency_block",
    "no_major_issue"
  ]),
  main_issue_ru: z.string().min(1),
  user_transcription: z.string().min(1),
  better_version_en: z.string().min(1),
  advanced_version_en: z.string().min(1),
  short_explanation_ru: z.string().min(1),
  repeat_task_ru: z.string().min(1),
  detected_weaknesses: z.array(z.unknown()),
  review_updates: z.array(z.unknown()),
  should_repeat_now: z.boolean()
});

export const drillGenerationSchema = z.object({
  type: z.literal("RU_TO_EN_SPEAKING"),
  prompt_ru: z.string().min(1),
  prompt_en: z.string().nullable(),
  target_words: z.array(z.string()),
  target_patterns: z.array(z.string()),
  target_grammar: z.array(z.string()),
  topic: z.string().nullable(),
  difficulty: z.string().nullable(),
  expected_answer_notes: z.string().nullable(),
  follow_up_variations: z.array(z.string())
});

export const vocabularyCardSchema = z.object({
  word: z.string().min(1),
  normalized_word: z.string().min(1),
  part_of_speech: z.string().nullable(),
  meaning_en: z.string().min(1),
  translation_ru: z.string().min(1),
  ipa: z.string().nullable(),
  pronunciation_hint_ru: z.string().nullable(),
  examples: z.array(z.string()).min(1),
  collocations: z.array(z.string()),
  tags: z.array(z.string()),
  word_family: z.object({
    verb: z.string().nullable().optional(),
    noun: z.string().nullable().optional(),
    adjective: z.string().nullable().optional(),
    adverb: z.string().nullable().optional(),
    phrases: z.array(z.string()).optional(),
    examples: z.array(z.string()).optional()
  })
});

export type FeedbackSchema = z.infer<typeof feedbackSchema>;
export type DrillGenerationSchema = z.infer<typeof drillGenerationSchema>;
export type VocabularyCardSchema = z.infer<typeof vocabularyCardSchema>;

export const drillGenerationJsonSchema = {
  name: "drill_generation",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      type: { type: "string", enum: ["RU_TO_EN_SPEAKING"] },
      prompt_ru: { type: "string" },
      prompt_en: { anyOf: [{ type: "string" }, { type: "null" }] },
      target_words: { type: "array", items: { type: "string" } },
      target_patterns: { type: "array", items: { type: "string" } },
      target_grammar: { type: "array", items: { type: "string" } },
      topic: { anyOf: [{ type: "string" }, { type: "null" }] },
      difficulty: { anyOf: [{ type: "string" }, { type: "null" }] },
      expected_answer_notes: { anyOf: [{ type: "string" }, { type: "null" }] },
      follow_up_variations: { type: "array", items: { type: "string" } }
    },
    required: [
      "type",
      "prompt_ru",
      "prompt_en",
      "target_words",
      "target_patterns",
      "target_grammar",
      "topic",
      "difficulty",
      "expected_answer_notes",
      "follow_up_variations"
    ]
  }
} as const;

export const feedbackJsonSchema = {
  name: "attempt_feedback",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      meaning_score: { type: "number", minimum: 1, maximum: 10 },
      grammar_score: { type: "number", minimum: 1, maximum: 10 },
      naturalness_score: { type: "number", minimum: 1, maximum: 10 },
      meaning_ok: { type: "boolean" },
      main_issue_type: {
        type: "string",
        enum: [
          "russian_structure",
          "grammar_tense",
          "word_choice",
          "preposition",
          "article",
          "connector_missing",
          "weak_pattern",
          "pronunciation_unclear",
          "word_family_gap",
          "fluency_block",
          "no_major_issue"
        ]
      },
      main_issue_ru: { type: "string" },
      user_transcription: { type: "string" },
      better_version_en: { type: "string" },
      advanced_version_en: { type: "string" },
      short_explanation_ru: { type: "string" },
      repeat_task_ru: { type: "string" },
      detected_weaknesses: { type: "array", items: { type: "string" } },
      review_updates: { type: "array", items: { type: "string" } },
      should_repeat_now: { type: "boolean" }
    },
    required: [
      "meaning_score",
      "grammar_score",
      "naturalness_score",
      "meaning_ok",
      "main_issue_type",
      "main_issue_ru",
      "user_transcription",
      "better_version_en",
      "advanced_version_en",
      "short_explanation_ru",
      "repeat_task_ru",
      "detected_weaknesses",
      "review_updates",
      "should_repeat_now"
    ]
  }
} as const;

export const vocabularyCardJsonSchema = {
  name: "vocabulary_card",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      word: { type: "string" },
      normalized_word: { type: "string" },
      part_of_speech: { anyOf: [{ type: "string" }, { type: "null" }] },
      meaning_en: { type: "string" },
      translation_ru: { type: "string" },
      ipa: { anyOf: [{ type: "string" }, { type: "null" }] },
      pronunciation_hint_ru: { anyOf: [{ type: "string" }, { type: "null" }] },
      examples: { type: "array", items: { type: "string" } },
      collocations: { type: "array", items: { type: "string" } },
      tags: { type: "array", items: { type: "string" } },
      word_family: {
        type: "object",
        additionalProperties: false,
        properties: {
          verb: { anyOf: [{ type: "string" }, { type: "null" }] },
          noun: { anyOf: [{ type: "string" }, { type: "null" }] },
          adjective: { anyOf: [{ type: "string" }, { type: "null" }] },
          adverb: { anyOf: [{ type: "string" }, { type: "null" }] },
          phrases: { type: "array", items: { type: "string" } },
          examples: { type: "array", items: { type: "string" } }
        },
        required: ["verb", "noun", "adjective", "adverb", "phrases", "examples"]
      }
    },
    required: [
      "word",
      "normalized_word",
      "part_of_speech",
      "meaning_en",
      "translation_ru",
      "ipa",
      "pronunciation_hint_ru",
      "examples",
      "collocations",
      "tags",
      "word_family"
    ]
  }
} as const;
