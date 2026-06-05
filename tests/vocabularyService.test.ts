import { describe, expect, test } from "vitest";
import { VocabularyService } from "../src/core/vocabulary/vocabulary.service.js";
import type { AiProvider } from "../src/core/drills/drill.types.js";

function createPrismaStub() {
  const vocabularyItems: any[] = [];
  const wordFamilyItems: any[] = [];
  return {
    vocabularyItem: {
      create: async ({ data }: any) => {
        const row = { id: `vocab-${vocabularyItems.length + 1}`, ...data };
        vocabularyItems.push(row);
        return row;
      }
    },
    wordFamilyItem: {
      create: async ({ data }: any) => {
        const row = { id: `family-${wordFamilyItems.length + 1}`, ...data };
        wordFamilyItems.push(row);
        return row;
      }
    },
    aiLog: { create: async ({ data }: any) => data },
    usageLog: { create: async ({ data }: any) => data },
    eventLog: { create: async ({ data }: any) => data },
    vocabularyItems,
    wordFamilyItems
  };
}

describe("VocabularyService", () => {
  test("creates vocabulary item and word family from AI card", async () => {
    const prisma = createPrismaStub();
    const aiProvider = {
      createVocabularyCard: async () => ({
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
    } as unknown as AiProvider;

    const result = await new VocabularyService(prisma as never, aiProvider).createVocabularyCard("user-1", "imply");

    expect(result.card.word).toBe("imply");
    expect(prisma.vocabularyItems).toHaveLength(1);
    expect(prisma.wordFamilyItems).toHaveLength(1);
  });
});
