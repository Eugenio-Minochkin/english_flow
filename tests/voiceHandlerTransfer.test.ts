import { describe, expect, test } from "vitest";
import { replyToRepeatSubmission } from "../src/apps/bot/handlers/voiceHandler.js";

describe("voice handler transfer replies", () => {
  test("sends the successful repeat message and then the automatic transfer drill", async () => {
    const replies: Array<{ text: string; options?: unknown }> = [];
    const ctx = {
      reply: async (text: string, options?: unknown) => {
        replies.push({ text, options });
      }
    };

    await replyToRepeatSubmission(ctx as never, {
      transcription: "I need to finish this task today, otherwise I won't make it to the call.",
      betterVersionEn: "I need to finish this task today, otherwise I won't make it to the call.",
      check: { success: true, score: 1, missingWords: [] },
      transferDrill: {
        drillId: "drill-2",
        sessionId: "session-2",
        promptRu: "Теперь применим это в новой ситуации.\n\nИдея:\n«Мне нужно отправить отчёт до утра, иначе я не успею к встрече.»",
        mode: "VOICE",
        languageMode: "ENGLISH_SPEECH"
      }
    });

    expect(replies).toHaveLength(3);
    expect(replies[0].text).toContain("Повтор засчитан");
    expect(replies[1].text).toContain("Скажи по-английски");
    expect(replies[1].text).toContain("Мне нужно отправить отчёт до утра");
    expect(replies[2].text).toContain("Скажи ответ голосом");
  });
});
