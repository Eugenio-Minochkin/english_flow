import { describe, expect, test } from "vitest";
import { feedbackSchema } from "../src/integrations/openai/schemas.js";

describe("feedback schema", () => {
  test("accepts valid Russian feedback with English better version", () => {
    const parsed = feedbackSchema.parse({
      meaning_score: 8,
      grammar_score: 7,
      naturalness_score: 7,
      meaning_ok: true,
      main_issue_type: "russian_structure",
      main_issue_ru: "Звучит немного как дословный перевод.",
      user_transcription: "I understand idea but speaking falls.",
      better_version_en: "I get the idea, but when I start speaking, the sentence falls apart.",
      advanced_version_en: "I understand the idea, but once I start speaking, the sentence falls apart.",
      short_explanation_ru: "Так естественнее для разговорного английского.",
      repeat_task_ru: "Повтори улучшенную фразу вслух.",
      detected_weaknesses: [],
      review_updates: [],
      should_repeat_now: true
    });
    expect(parsed.meaning_ok).toBe(true);
  });

  test("rejects unsupported issue type", () => {
    expect(() =>
      feedbackSchema.parse({
        meaning_score: 8,
        grammar_score: 7,
        naturalness_score: 7,
        meaning_ok: true,
        main_issue_type: "unsupported",
        main_issue_ru: "Ошибка.",
        user_transcription: "text",
        better_version_en: "Better text.",
        advanced_version_en: "Advanced text.",
        short_explanation_ru: "Объяснение.",
        repeat_task_ru: "Повтори.",
        detected_weaknesses: [],
        review_updates: [],
        should_repeat_now: true
      })
    ).toThrow();
  });
});
