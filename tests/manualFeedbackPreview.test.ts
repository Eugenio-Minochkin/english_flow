import { describe, expect, test } from "vitest";
import { ruMessages } from "../src/apps/bot/messages/ru.js";
import { actionLabels } from "../src/apps/bot/keyboards/actionKeyboard.js";

describe("manual feedback preview", () => {
  test("keeps approved trainer-style copy visible in assertions", () => {
    const text = ruMessages.feedback({
      meaning_score: 8,
      grammar_score: 6,
      naturalness_score: 7,
      meaning_ok: true,
      main_issue_type: "grammar_tense",
      main_issue_ru: "Нужно показать процесс, который длился весь день.",
      user_transcription: "I work on this AI project all the day.",
      better_version_en: "I've been working on this AI project all day.",
      advanced_version_en: "I've been working on this AI project all day, and I'm exhausted.",
      short_explanation_ru: "Present Perfect Continuous естественнее для действия, которое продолжалось до сейчас.",
      repeat_task_ru: "Повтори.",
      detected_weaknesses: [],
      review_updates: [],
      should_repeat_now: true
    });

    expect(text).toContain("🎧 <b>Я услышал:</b>");
    expect(text).toContain("✅ <b>Смысл:</b> ок");
    expect(text).toContain("💬 <b>Лучше:</b>");
    expect(actionLabels.newDrill).toBe("🎯 Новый подход");
  });
});
