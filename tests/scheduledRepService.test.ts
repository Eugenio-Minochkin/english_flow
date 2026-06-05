import { describe, expect, test } from "vitest";
import { ScheduledRepService } from "../src/core/scheduling/scheduledRep.service.js";

function createPrismaStub() {
  const users = [
    {
      id: "user-1",
      telegramId: BigInt(428925787),
      timezone: "Asia/Bangkok",
      createdAt: new Date("2026-06-01T00:00:00.000Z"),
      firstWeekDrillCount: 3,
      dailyDrillCount: 5,
      isPaused: false
    }
  ];
  const dailyPlans: any[] = [];
  const scheduledReps: any[] = [];
  return {
    users,
    dailyPlans,
    scheduledReps,
    user: {
      findMany: async () => users,
      findUniqueOrThrow: async ({ where }: any) => users.find((user) => user.id === where.id)
    },
    dailyPlan: {
      findFirst: async ({ where }: any) => dailyPlans.find((plan) => plan.userId === where.userId),
      create: async ({ data }: any) => {
        const row = { id: `plan-${dailyPlans.length + 1}`, createdAt: new Date(), updatedAt: new Date(), ...data };
        dailyPlans.push(row);
        return row;
      }
    },
    scheduledRep: {
      findMany: async ({ where }: any = {}) => scheduledReps.filter((rep) => !where?.userId || rep.userId === where.userId),
      findUniqueOrThrow: async ({ where, include }: any) => {
        const rep = scheduledReps.find((item) => item.id === where.id);
        return include?.user ? { ...rep, user: users.find((user) => user.id === rep.userId) } : rep;
      },
      create: async ({ data }: any) => {
        const row = { id: `rep-${scheduledReps.length + 1}`, status: "PLANNED", snoozeCount: 0, createdAt: new Date(), updatedAt: new Date(), ...data };
        scheduledReps.push(row);
        return row;
      },
      update: async ({ where, data }: any) => {
        const row = scheduledReps.find((rep) => rep.id === where.id);
        Object.assign(row, data, { updatedAt: new Date() });
        return row;
      },
      count: async ({ where }: any) => scheduledReps.filter((rep) => rep.userId === where.userId && rep.status === where.status).length
    },
    eventLog: { create: async ({ data }: any) => data }
  };
}

function createBossStub() {
  return {
    sent: [] as any[],
    send: async function (name: string, data: unknown, options?: unknown) {
      this.sent.push({ name, data, options });
      return `${name}-job`;
    }
  };
}

describe("ScheduledRepService", () => {
  test("creates a daily plan and schedules first-week reps", async () => {
    const prisma = createPrismaStub();
    const boss = createBossStub();

    const plan = await new ScheduledRepService(prisma as never, boss as never).createDailyPlanForUser(prisma.users[0] as never, new Date("2026-06-04T00:00:00.000Z"));

    expect(plan.targetDrillCount).toBe(3);
    expect(prisma.scheduledReps).toHaveLength(3);
    expect(boss.sent).toHaveLength(3);
    expect(boss.sent[0].name).toBe("scheduled-rep.send");
  });

  test("marks scheduled rep as skipped without creating a drill", async () => {
    const prisma = createPrismaStub();
    const service = new ScheduledRepService(prisma as never);
    await service.createDailyPlanForUser(prisma.users[0] as never, new Date("2026-06-04T00:00:00.000Z"));

    const rep = await service.skipRep("rep-1");

    expect(rep.status).toBe("SKIPPED");
  });

  test("snoozes scheduled rep by thirty minutes", async () => {
    const prisma = createPrismaStub();
    const service = new ScheduledRepService(prisma as never);
    await service.createDailyPlanForUser(prisma.users[0] as never, new Date("2026-06-04T00:00:00.000Z"));
    const before = prisma.scheduledReps[0].scheduledAt.getTime();

    const rep = await service.snoozeRep("rep-1", 30);

    expect(rep.status).toBe("SNOOZED");
    expect(rep.snoozeCount).toBe(1);
    expect(rep.scheduledAt.getTime()).toBe(before + 30 * 60_000);
  });

  test("sends scheduled rep prompt and marks rep as sent", async () => {
    const prisma = createPrismaStub();
    const service = new ScheduledRepService(prisma as never);
    await service.createDailyPlanForUser(prisma.users[0] as never, new Date("2026-06-04T00:00:00.000Z"));
    const sent: any[] = [];
    const bot = {
      api: {
        sendMessage: async (telegramId: number, text: string, options: unknown) => {
          sent.push({ telegramId, text, options });
        }
      }
    };

    await service.sendScheduledRepMessage("rep-1", bot as never);

    expect(sent).toHaveLength(1);
    expect(sent[0].telegramId).toBe(428925787);
    expect(sent[0].text).toContain("60-секундный");
    expect(prisma.scheduledReps[0].status).toBe("SENT");
  });
});
