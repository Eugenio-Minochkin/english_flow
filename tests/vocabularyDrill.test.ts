import { describe, expect, test } from "vitest";
import { DrillService } from "../src/core/drills/drill.service.js";
import type { AiProvider, SttProvider } from "../src/core/drills/drill.types.js";

function createPrismaStub() {
  const drills: any[] = [];
  const sessions: any[] = [];
  const vocabularyItems = [
    {
      id: "vocab-1",
      userId: "user-1",
      word: "imply",
      normalizedWord: "imply",
      translationRu: "подразумевать",
      meaningEn: "to suggest something indirectly",
      examples: ["His smile seemed to imply that he already knew the answer."],
      collocations: ["imply that"],
      status: "active",
      nextReviewAt: new Date("2026-06-05T00:00:00.000Z"),
      createdAt: new Date("2026-06-05T00:00:00.000Z")
    }
  ];

  return {
    drills,
    sessions,
    vocabularyItems,
    usageLog: { count: async () => 0, create: async ({ data }: any) => data },
    aiLog: { create: async ({ data }: any) => data },
    eventLog: { create: async ({ data }: any) => data },
    userState: { upsert: async ({ update }: any) => update },
    vocabularyItem: {
      findFirst: async () => vocabularyItems[0],
      update: async ({ where, data }: any) => {
        const item = vocabularyItems.find((row) => row.id === where.id);
        if (!item) throw new Error("Vocabulary item not found");
        Object.assign(item, data);
        return item;
      }
    },
    drill: {
      create: async ({ data }: any) => {
        const row = { id: `drill-${drills.length + 1}`, ...data };
        drills.push(row);
        return row;
      }
    },
    drillSession: {
      create: async ({ data }: any) => {
        const row = { id: `session-${sessions.length + 1}`, languageMode: "ENGLISH_SPEECH", ...data };
        sessions.push(row);
        return row;
      }
    }
  };
}

describe("vocabulary speaking drills", () => {
  test("scheduled drill uses a due vocabulary item instead of a generic prompt", async () => {
    const prisma = createPrismaStub();
    const aiProvider = { generateDrill: async () => ({}) } as unknown as AiProvider;
    const sttProvider = {} as SttProvider;
    const user = { id: "user-1" };

    const drill = await new DrillService(prisma as never, aiProvider, sttProvider).startScheduledDrill(user as never, { scheduledRepId: "rep-1" });

    expect(drill.promptRu).toContain("imply");
    expect(prisma.drills[0]).toMatchObject({
      type: "VOCABULARY_IN_SPEECH",
      targetWords: ["imply"],
      source: "vocabulary"
    });
    expect(prisma.sessions[0].scheduledRepId).toBe("rep-1");
  });
});
