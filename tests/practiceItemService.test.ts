import { describe, expect, test } from "vitest";
import { PracticeItemService } from "../src/core/practice/practiceItem.service.js";
import type { FeedbackResult } from "../src/core/drills/drill.types.js";

function createPrismaStub() {
  const practiceItems: any[] = [];
  return {
    practiceItems,
    practiceItem: {
      findFirst: async ({ where }: any) =>
        practiceItems.find(
          (item) =>
            (!where.id || item.id === where.id) &&
            (!where.userId || item.userId === where.userId) &&
            (!where.targetAnswerEn || item.targetAnswerEn === where.targetAnswerEn)
        ) ?? null,
      findMany: async () => practiceItems,
      create: async ({ data }: any) => {
        const row = { id: `practice-${practiceItems.length + 1}`, successCount: 0, failureCount: 0, status: "WEAK", createdAt: new Date(), updatedAt: new Date(), ...data };
        practiceItems.push(row);
        return row;
      },
      update: async ({ where, data }: any) => {
        const row = practiceItems.find((item) => item.id === where.id);
        if (!row) throw new Error("Practice item not found");
        const resolvedData = resolveUpdateData(data, row);
        Object.assign(row, resolvedData, { updatedAt: new Date() });
        return row;
      }
    }
  };
}

function resolveUpdateData(data: any, row: any) {
  const resolved = { ...data };
  for (const key of ["successCount", "failureCount"]) {
    if (typeof resolved[key]?.increment === "number") resolved[key] = row[key] + resolved[key].increment;
  }
  return resolved;
}

function feedback(overrides: Partial<FeedbackResult> = {}): FeedbackResult {
  return {
    meaning_score: 8,
    grammar_score: 6,
    naturalness_score: 7,
    meaning_ok: true,
    main_issue_type: "grammar_tense",
    main_issue_ru: "Нужно поправить время.",
    user_transcription: "I work on it yesterday.",
    better_version_en: "I worked on it yesterday.",
    advanced_version_en: "I worked on it yesterday and finished it.",
    short_explanation_ru: "Так естественнее.",
    repeat_task_ru: "Повтори улучшенную фразу.",
    detected_weaknesses: [],
    review_updates: [],
    should_repeat_now: true,
    ...overrides
  };
}

describe("PracticeItemService", () => {
  test("creates weak mistake item when feedback has an error", async () => {
    const prisma = createPrismaStub();
    const item = await new PracticeItemService(prisma as never).createFromFeedback({
      userId: "user-1",
      attemptId: "attempt-1",
      drill: { promptRu: "Я работал над этим вчера." },
      feedback: feedback()
    });

    expect(item).toMatchObject({
      type: "MISTAKE",
      status: "WEAK",
      promptRu: "Я работал над этим вчера.",
      targetAnswerEn: "I worked on it yesterday.",
      mistakeType: "grammar_tense",
      mistakeNoteRu: "Нужно поправить время.",
      failureCount: 1
    });
    expect(item.nextReviewAt?.getTime()).toBeGreaterThan(Date.now());
  });

  test("updates review interval on success and fail", async () => {
    const prisma = createPrismaStub();
    const service = new PracticeItemService(prisma as never);
    const item = await service.createFromFeedback({
      userId: "user-1",
      attemptId: "attempt-1",
      drill: { promptRu: "Скажи идею." },
      feedback: feedback({ grammar_score: 9, naturalness_score: 9, main_issue_type: "no_major_issue" })
    });

    const success = await service.scheduleAfterResult(item.id, "success", new Date("2026-06-05T00:00:00.000Z"));
    expect(success.status).toBe("LEARNING");
    expect(success.successCount).toBe(2);
    expect(success.nextReviewAt?.toISOString()).toBe("2026-06-08T00:00:00.000Z");

    const fail = await service.scheduleAfterResult(item.id, "fail", new Date("2026-06-05T00:00:00.000Z"));
    expect(fail.status).toBe("WEAK");
    expect(fail.failureCount).toBe(1);
    expect(fail.nextReviewAt?.toISOString()).toBe("2026-06-05T04:00:00.000Z");
  });
});
