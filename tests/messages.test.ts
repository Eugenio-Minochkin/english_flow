import { describe, expect, test } from "vitest";
import { ruMessages } from "../src/apps/bot/messages/ru.js";

describe("Russian message templates", () => {
  test("contains main bot messages", () => {
    expect(ruMessages.accessDenied).toContain("Доступ");
    expect(ruMessages.help).toContain("/drill");
    expect(ruMessages.drillPrompt("тест")).toContain("Скажи по-английски");
    expect(ruMessages.sttFailed).toContain("аудио");
    expect(ruMessages.repeatAcceptedText).toContain("Повтор принят");
    expect(ruMessages.statsComingSoon).toContain("Статистика");
    expect(ruMessages.settingsComingSoon).toContain("Настройки");
    expect(ruMessages.voiceTooLong(91, 90)).toContain("90 секунд");
    expect(ruMessages.callbackSendVoiceRepeat).toContain("повтор");
  });

  test("formats feedback in trainer style with html accents", () => {
    const message = ruMessages.feedback({
      meaning_score: 8,
      grammar_score: 6,
      naturalness_score: 7,
      meaning_ok: true,
      main_issue_type: "grammar_tense",
      main_issue_ru: "Нужно показать процесс, который длился весь день.",
      user_transcription: "I work on this AI project all the day.",
      better_version_en: "I've been working on this AI project all day.",
      advanced_version_en: "I've been working on this AI project all day, and I'm pretty exhausted.",
      short_explanation_ru: "Present Perfect Continuous естественнее для действия, которое продолжалось до сейчас.",
      repeat_task_ru: "Повтори голосом улучшенную фразу.",
      detected_weaknesses: [],
      review_updates: [],
      should_repeat_now: true
    });

    expect(message).toContain("<b>Я услышал:</b>");
    expect(message).toContain("🎯 <b>Главная правка:</b>");
    expect(message).toContain("🧠 <b>Почему:</b>");
    expect(message).toContain("🎙 <b>Теперь повтори:</b>");
    expect(message).toContain("I've been working on this AI project all day.");
  });

  test("formats accepted repeat with the same html style as feedback", () => {
    const message = ruMessages.repeatAccepted(
      "I need to finish, this task by tonight. Otherwise, I won't make it to the call.",
      "I need to finish this task by tonight, otherwise I won't make it to the call."
    );

    expect(message).toContain("✅ <b>Повтор принят.</b>");
    expect(message).toContain("🎧 <b>Я услышал:</b>");
    expect(message).toContain("🎯 <b>Целевая фраза:</b>");
    expect(message).toContain("🎯 <b>Новый подход:</b>");
    expect(message).toContain("Нажми /drill или кнопку «Новый подход».");
  });

  test("formats schedule and vocabulary messages", () => {
    expect(ruMessages.scheduleSetup({ count: 3, windows: ["morning", "afternoon", "evening"], quietHoursStart: "22:00", quietHoursEnd: "10:00" })).toContain(
      "Расписание"
    );
    expect(
      ruMessages.vocabularyCard({
        word: "imply",
        normalized_word: "imply",
        part_of_speech: "verb",
        meaning_en: "to suggest something without saying it directly",
        translation_ru: "подразумевать",
        ipa: "/ɪmˈplaɪ/",
        pronunciation_hint_ru: "им-ПЛАЙ",
        examples: ["Are you implying that it was my fault?"],
        collocations: ["imply that"],
        tags: ["lesson"],
        word_family: { verb: "imply", noun: "implication", adjective: "implicit", adverb: "implicitly" }
      })
    ).toContain("<b>imply</b>");
    expect(ruMessages.askWordInput).toContain("слово");
    expect(ruMessages.askLessonImportInput).toContain("урока");
  });
});
