import { describe, expect, test } from "vitest";
import { DrillService } from "../src/core/drills/drill.service.js";
import type { AiProvider, SttProvider } from "../src/core/drills/drill.types.js";

function createPrismaStub() {
  const drills: any[] = [];
  const sessions: any[] = [];
  const states: any[] = [];
  const practiceItem = {
    id: "practice-1",
    userId: "user-1",
    status: "WEAK",
    promptRu: "Мне нужно закончить задачу сегодня, иначе я не успею к звонку.",
    targetAnswerEn: "I need to finish this task today, otherwise I won't make it to the call.",
    betterVersionEn: "I need to finish this task today, otherwise I won't make it to the call.",
    nextReviewAt: new Date("2026-06-05T00:00:00.000Z"),
    successCount: 0,
    failureCount: 0
  };

  return {
    drills,
    sessions,
    states,
    usageLog: { count: async () => 0, create: async ({ data }: any) => data },
    aiLog: { create: async ({ data }: any) => data },
    eventLog: { create: async ({ data }: any) => data },
    userState: {
      findUnique: async () => ({
        userId: "user-1",
        state: "WAITING_FOR_REPEAT",
        payload: {
          sessionId: "session-1",
          practiceItemId: "practice-1",
          betterVersionEn: practiceItem.betterVersionEn,
          canStartTransfer: true
        },
        expiresAt: null
      }),
      upsert: async ({ create, update }: any) => {
        const row = { ...(create ?? {}), ...(update ?? {}) };
        states.push(row);
        return row;
      }
    },
    practiceItem: {
      findFirst: async () => practiceItem,
      update: async ({ data }: any) => ({ ...practiceItem, ...data })
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

describe("transfer drills", () => {
  test("starts one transfer drill after a successful recorded repeat", async () => {
    const prisma = createPrismaStub();
    const aiProvider = {
      generateTransferDrill: async () => ({
        type: "RU_TO_EN_SPEAKING",
        prompt_ru: "Мне нужно отправить отчёт до утра, иначе я не успею к встрече.",
        prompt_en: null,
        target_words: ["report", "meeting"],
        target_patterns: ["I need to ..., otherwise I won't ..."],
        target_grammar: [],
        topic: "work",
        difficulty: "B1",
        expected_answer_notes: "Use: I need to ..., otherwise I won't ...",
        follow_up_variations: []
      })
    } as unknown as AiProvider;
    const sttProvider = {
      transcribeAudio: async () => ({
        text: "I need to finish this task today, otherwise I won't make it to the call.",
        durationSeconds: 2
      })
    } as SttProvider;

    const submission = await new DrillService(prisma as never, aiProvider, sttProvider).submitVoiceMessage({ id: "user-1" } as never, "voice-1", "missing.ogg");

    expect(submission.kind).toBe("repeat_recorded");
    if (submission.kind !== "repeat_recorded") throw new Error("Expected repeat result");
    expect(submission.result.check.success).toBe(true);
    expect(submission.result.transferDrill?.promptRu).toContain("Мне нужно отправить отчёт до утра");
    expect(prisma.drills[0]).toMatchObject({
      source: "transfer",
      targetPatterns: ["I need to ..., otherwise I won't ..."]
    });
    expect(prisma.states.at(-1)).toMatchObject({
      state: "WAITING_FOR_DRILL_ANSWER",
      payload: { sessionId: "session-1", isTransfer: true }
    });
  });
});
