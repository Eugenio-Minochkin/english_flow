import { describe, expect, test } from "vitest";
import { handleVocabularyMenuCallback, replyWithVocabularyMenu } from "../src/apps/bot/flows/vocabularyMenu.js";
import { vocabularyCallbacks } from "../src/apps/bot/keyboards/actionKeyboard.js";
import { isMainMenuText } from "../src/apps/bot/handlers/textHandler.js";

function createCtx() {
  const replies: Array<{ text: string; options?: unknown }> = [];
  return {
    replies,
    ctx: {
      reply: async (text: string, options?: unknown) => {
        replies.push({ text, options });
      },
      answerCallbackQuery: async () => undefined,
      englishFlowUser: { id: "user-1" }
    }
  };
}

describe("vocabulary menu flow", () => {
  test("recognizes main menu labels before waiting-state text input", () => {
    expect(isMainMenuText("📚 Импорт урока")).toBe(true);
    expect(isMainMenuText("imply")).toBe(false);
  });

  test("shows existing words and action buttons from the Words menu", async () => {
    const { ctx, replies } = createCtx();
    const vocabularyService = {
      listLatestVocabularyItems: async () => [
        {
          word: "imply",
          translationRu: "подразумевать",
          status: "active",
          nextReviewAt: null
        }
      ]
    };

    await replyWithVocabularyMenu(ctx as never, vocabularyService as never, "user-1");

    expect(replies).toHaveLength(1);
    expect(replies[0].text).toContain("Мои слова: 1");
    expect(replies[0].text).toContain("imply");
    expect(JSON.stringify(replies[0].options)).toContain(vocabularyCallbacks.add);
    expect(JSON.stringify(replies[0].options)).toContain(vocabularyCallbacks.list);
  });

  test("add callback switches the user into word input mode", async () => {
    const { ctx, replies } = createCtx();
    const states: unknown[] = [];
    const stateService = {
      set: async (_userId: string, state: string, payload: unknown) => {
        states.push({ state, payload });
      }
    };
    const vocabularyService = { listLatestVocabularyItems: async () => [] };

    const handled = await handleVocabularyMenuCallback(ctx as never, vocabularyCallbacks.add, vocabularyService as never, stateService as never);

    expect(handled).toBe(true);
    expect(states).toContainEqual({ state: "WAITING_FOR_WORD_INPUT", payload: {} });
    expect(replies[0].text).toContain("Напиши слово");
  });
});
