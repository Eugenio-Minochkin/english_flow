import { describe, expect, test } from "vitest";
import { ruMessages } from "../src/apps/bot/messages/ru.js";

describe("words formatting", () => {
  test("formats empty vocabulary list", () => {
    expect(ruMessages.wordsList([])).toContain("Пока слов нет");
  });

  test("formats non-empty vocabulary list", () => {
    const message = ruMessages.wordsList([
      {
        word: "imply",
        translationRu: "подразумевать",
        status: "active",
        nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    ]);

    expect(message).toContain("📚 <b>Мои слова: 1</b>");
    expect(message).toContain("imply");
    expect(message).toContain("подразумевать");
    expect(message).toContain("active");
  });
});
