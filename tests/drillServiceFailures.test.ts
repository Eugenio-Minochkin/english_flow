import { describe, expect, test } from "vitest";
import { DrillService } from "../src/core/drills/drill.service.js";
import type { AiProvider, SttProvider } from "../src/core/drills/drill.types.js";

function createPrismaStub() {
  const state = { state: "WAITING_FOR_DRILL_ANSWER", payload: { sessionId: "session-1" }, expiresAt: null };
  const session = { id: "session-1", userId: "user-1", drillId: "drill-1", status: "ACTIVE", languageMode: "ENGLISH_SPEECH" };
  const drill = {
    id: "drill-1",
    promptRu: "Скажи тестовую фразу.",
    targetWords: [],
    targetPatterns: [],
    targetGrammar: [],
    expectedAnswerNotes: null
  };
  return {
    userState: {
      findUnique: async () => state,
      upsert: async ({ update }: { update: unknown }) => ({ ...state, ...(update as object) })
    },
    usageLog: {
      count: async () => 0,
      create: async ({ data }: { data: unknown }) => data
    },
    drillSession: {
      findFirstOrThrow: async () => session,
      update: async ({ data }: { data: unknown }) => ({ ...session, ...(data as object) })
    },
    drill: {
      findUniqueOrThrow: async () => drill
    },
    aiLog: {
      rows: [] as unknown[],
      create: async function (this: { rows: unknown[] }, { data }: { data: unknown }) {
        this.rows.push(data);
        return data;
      }
    },
    attempt: {
      rows: [] as unknown[],
      create: async function (this: { rows: unknown[] }, { data }: { data: unknown }) {
        const row = { id: `attempt-${this.rows.length + 1}`, ...(data as object) };
        this.rows.push(row);
        return row;
      }
    },
    eventLog: {
      create: async ({ data }: { data: unknown }) => data
    }
  };
}

const user = { id: "user-1" };

describe("DrillService AI failure handling", () => {
  test("saves an attempt when feedback generation fails after transcription", async () => {
    const prisma = createPrismaStub();
    const aiProvider = {
      analyzeAttempt: async () => {
        throw new Error("OpenAI unavailable");
      }
    } as Partial<AiProvider> as AiProvider;
    const sttProvider = { transcribeAudio: async () => ({ text: "I tried to answer.", durationSeconds: 2 }) } as SttProvider;

    await expect(new DrillService(prisma as never, aiProvider, sttProvider).submitTextAttempt(user as never, "I tried to answer.")).rejects.toThrow(
      "OpenAI unavailable"
    );

    expect(prisma.attempt.rows).toHaveLength(1);
    expect(prisma.attempt.rows[0]).toMatchObject({
      userId: "user-1",
      drillSessionId: "session-1",
      userText: "I tried to answer.",
      transcription: "I tried to answer.",
      feedbackJson: null
    });
  });

  test("logs invalid AI feedback before surfacing validation failure", async () => {
    const prisma = createPrismaStub();
    const aiProvider = {
      analyzeAttempt: async () => ({ meaning_score: 8 })
    } as unknown as AiProvider;
    const sttProvider = { transcribeAudio: async () => ({ text: "I tried to answer.", durationSeconds: 2 }) } as SttProvider;

    await expect(new DrillService(prisma as never, aiProvider, sttProvider).submitTextAttempt(user as never, "I tried to answer.")).rejects.toThrow();

    expect(prisma.aiLog.rows).toContainEqual(
      expect.objectContaining({
        purpose: "attempt_feedback",
        validationStatus: "invalid"
      })
    );
    expect(prisma.attempt.rows).toHaveLength(1);
  });
});
