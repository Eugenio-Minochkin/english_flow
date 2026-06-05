import type { PracticeItemStatus, PrismaClient } from "@prisma/client";
import type { PracticeFeedbackInput, PracticeResult } from "./practiceItem.types.js";

const statusPriority: Record<PracticeItemStatus, number> = {
  WEAK: 0,
  LEARNING: 1,
  ACTIVE: 2,
  MASTERED: 3
};

export class PracticeItemService {
  constructor(private readonly prisma: PrismaClient) {}

  async createFromFeedback(input: PracticeFeedbackInput, now = new Date()) {
    const hasRealIssue =
      input.feedback.main_issue_type !== "no_major_issue" ||
      !input.feedback.meaning_ok ||
      input.feedback.grammar_score < 8 ||
      input.feedback.naturalness_score < 8;

    const existing = await this.prisma.practiceItem.findFirst({
      where: {
        userId: input.userId,
        targetAnswerEn: input.feedback.better_version_en
      }
    });

    const data = hasRealIssue
      ? {
          type: "MISTAKE" as const,
          status: "WEAK" as const,
          promptRu: input.drill.promptRu,
          targetAnswerEn: input.feedback.better_version_en,
          betterVersionEn: input.feedback.better_version_en,
          sourceAttemptId: input.attemptId,
          mistakeType: input.feedback.main_issue_type,
          mistakeNoteRu: input.feedback.main_issue_ru,
          nextReviewAt: addHours(now, 4),
          failureCount: (existing?.failureCount ?? 0) + 1
        }
      : {
          type: "PHRASE" as const,
          status: "LEARNING" as const,
          promptRu: input.drill.promptRu,
          targetAnswerEn: input.feedback.better_version_en,
          betterVersionEn: input.feedback.better_version_en,
          sourceAttemptId: input.attemptId,
          nextReviewAt: addDays(now, 1),
          successCount: (existing?.successCount ?? 0) + 1
        };

    if (existing) {
      return this.prisma.practiceItem.update({
        where: { id: existing.id },
        data
      });
    }

    return this.prisma.practiceItem.create({
      data: {
        userId: input.userId,
        ...data
      }
    });
  }

  async pickDuePracticeItem(userId: string, now = new Date()) {
    const dueItems = await this.prisma.practiceItem.findMany({
      where: {
        userId,
        status: { not: "MASTERED" },
        nextReviewAt: { lte: now }
      },
      orderBy: [{ nextReviewAt: "asc" }, { createdAt: "asc" }]
    });
    dueItems.sort((a, b) => statusPriority[a.status] - statusPriority[b.status] || compareDates(a.nextReviewAt, b.nextReviewAt));
    return dueItems[0] ?? null;
  }

  async scheduleAfterResult(practiceItemId: string, result: PracticeResult, now = new Date()) {
    const current = await this.prisma.practiceItem.findFirst({ where: { id: practiceItemId } });
    if (!current) throw new Error("Practice item not found");

    if (result === "fail") {
      return this.prisma.practiceItem.update({
        where: { id: practiceItemId },
        data: {
          failureCount: { increment: 1 },
          status: "WEAK",
          lastSeenAt: now,
          nextReviewAt: addHours(now, 4)
        }
      });
    }

    const nextSuccessCount = current.successCount + 1;
    return this.prisma.practiceItem.update({
      where: { id: practiceItemId },
      data: {
        successCount: { increment: 1 },
        status: statusForSuccessCount(nextSuccessCount),
        lastSeenAt: now,
        nextReviewAt: addDays(now, daysForSuccessCount(nextSuccessCount))
      }
    });
  }
}

function statusForSuccessCount(successCount: number): PracticeItemStatus {
  if (successCount >= 5) return "MASTERED";
  if (successCount >= 3) return "ACTIVE";
  return "LEARNING";
}

function daysForSuccessCount(successCount: number) {
  if (successCount >= 5) return 30;
  if (successCount === 4) return 14;
  if (successCount === 3) return 7;
  if (successCount === 2) return 3;
  return 1;
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function compareDates(a: Date | null, b: Date | null) {
  return (a?.getTime() ?? 0) - (b?.getTime() ?? 0);
}
