import { describe, expect, test } from "vitest";
import { VocabularyService } from "../src/core/vocabulary/vocabulary.service.js";
import type { AiProvider } from "../src/core/drills/drill.types.js";

function createPrismaStub() {
  const vocabularyItems: any[] = [];
  const wordFamilyItems: any[] = [];
  return {
    vocabularyItem: {
      findFirst: async (_args: any) => null,
      create: async ({ data }: any) => {
        const row = { id: `vocab-${vocabularyItems.length + 1}`, ...data };
        vocabularyItems.push(row);
        return row;
      },
      update: async ({ where, data }: any) => {
        const row = vocabularyItems.find((item) => item.id === where.id);
        Object.assign(row, data);
        return row;
      },
      updateMany: async ({ where, data }: any) => {
        const rows = vocabularyItems.filter((item) => item.userId === where.userId && item.normalizedWord === where.normalizedWord);
        rows.forEach((row) => Object.assign(row, data));
        return { count: rows.length };
      }
    },
    wordFamilyItem: {
      create: async ({ data }: any) => {
        const row = { id: `family-${wordFamilyItems.length + 1}`, ...data };
        wordFamilyItems.push(row);
        return row;
      },
      upsert: async ({ where, create, update }: any) => {
        const row = wordFamilyItems.find((item) => item.vocabularyItemId === where.vocabularyItemId);
        if (row) {
          Object.assign(row, update);
          return row;
        }
        const created = { id: `family-${wordFamilyItems.length + 1}`, ...create };
        wordFamilyItems.push(created);
        return created;
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

  test("picks the oldest due active vocabulary item for review", async () => {
    const prisma = createPrismaStub();
    prisma.vocabularyItems.push(
      { id: "future", userId: "user-1", status: "active", nextReviewAt: new Date("2026-06-06T00:00:00.000Z"), createdAt: new Date("2026-06-01T00:00:00.000Z") },
      {
        id: "due",
        userId: "user-1",
        word: "imply",
        normalizedWord: "imply",
        translationRu: "подразумевать",
        meaningEn: "to suggest something indirectly",
        examples: ["This implies a problem."],
        collocations: ["imply that"],
        status: "active",
        nextReviewAt: new Date("2026-06-04T00:00:00.000Z"),
        createdAt: new Date("2026-06-02T00:00:00.000Z")
      }
    );
    prisma.vocabularyItem.findFirst = async ({ where }: any) =>
      prisma.vocabularyItems.find((item) => item.userId === where.userId && item.status === "active" && item.nextReviewAt <= new Date("2026-06-05T00:00:00.000Z"));

    const item = await new VocabularyService(prisma as never, {} as never).pickDueVocabularyItem("user-1", new Date("2026-06-05T00:00:00.000Z"));

    expect(item?.word).toBe("imply");
  });

  test("updates an existing vocabulary item instead of creating a duplicate", async () => {
    const prisma = createPrismaStub();
    prisma.vocabularyItem.findFirst = async ({ where }: any) =>
      prisma.vocabularyItems.find((item) => item.userId === where.userId && item.normalizedWord === where.normalizedWord) ?? null;
    const aiProvider = {
      createVocabularyCard: async () => ({
        word: "imply",
        normalized_word: "imply",
        part_of_speech: "verb",
        meaning_en: "to suggest indirectly",
        translation_ru: "подразумевать",
        ipa: "/ɪmˈplaɪ/",
        pronunciation_hint_ru: "им-ПЛАЙ",
        examples: ["This implies a problem."],
        collocations: ["imply that"],
        tags: ["manual"],
        word_family: { verb: "imply", noun: "implication", adjective: "implicit", adverb: "implicitly", phrases: [], examples: [] }
      })
    } as unknown as AiProvider;

    const service = new VocabularyService(prisma as never, aiProvider);
    await service.createVocabularyCard("user-1", "imply");
    await service.createVocabularyCard("user-1", "Imply");

    expect(prisma.vocabularyItems).toHaveLength(1);
    expect(prisma.wordFamilyItems).toHaveLength(1);
    expect(prisma.vocabularyItems[0]).toMatchObject({ normalizedWord: "imply", source: "manual" });
  });
});
