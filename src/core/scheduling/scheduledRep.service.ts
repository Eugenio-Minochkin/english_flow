import type PgBoss from "pg-boss";
import type { Bot } from "grammy";
import type { PrismaClient, ScheduledRep, User } from "@prisma/client";
import { planRepTimesForDay, shouldSuppressScheduledReps } from "./scheduling.service.js";
import { scheduledRepQueue, scheduledRepReminderQueue } from "./scheduling.queues.js";
import { ruMessages } from "../../apps/bot/messages/ru.js";
import { scheduledRepKeyboard } from "../../apps/bot/keyboards/actionKeyboard.js";

export class ScheduledRepService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly boss?: PgBoss
  ) {}

  async createDailyPlansForAllUsers(now = new Date()) {
    const users = await this.prisma.user.findMany({ where: { isPaused: false } });
    const plans = [];
    for (const user of users) {
      plans.push(await this.createDailyPlanForUser(user, now));
    }
    return plans;
  }

  async createDailyPlanForUser(
    user: Pick<User, "id" | "timezone" | "createdAt" | "firstWeekDrillCount" | "dailyDrillCount" | "isPaused" | "scheduleWindows">,
    day = new Date()
  ) {
    const date = startOfUtcDay(day);
    const existing = await this.prisma.dailyPlan.findFirst({ where: { userId: user.id, date } });
    if (existing) return existing;

    const targetDrillCount = this.targetDrillCountForUser(user, day);
    const plan = await this.prisma.dailyPlan.create({
      data: {
        userId: user.id,
        date,
        timezone: user.timezone,
        targetDrillCount
      }
    });

    if (user.isPaused) return plan;

    const suppress = await this.shouldSuppressUserReps(user.id, targetDrillCount);
    if (suppress) return plan;

    const plannedTimes = planRepTimesForDay(date, targetDrillCount, user.timezone, readScheduleWindows(user.scheduleWindows)).filter(
      (planned) => planned.scheduledAt > day
    );
    for (const planned of plannedTimes) {
      const rep = await this.prisma.scheduledRep.create({
        data: {
          userId: user.id,
          dailyPlanId: plan.id,
          scheduledAt: planned.scheduledAt,
          type: "RU_TO_EN_SPEAKING",
          status: "PLANNED"
        }
      });
      await this.enqueueRep(rep);
    }

    return plan;
  }

  async listUpcomingReps(userId: string, limit = 5) {
    return this.prisma.scheduledRep.findMany({
      where: { userId },
      orderBy: { scheduledAt: "asc" },
      take: limit
    });
  }

  async sendRepNow(userId: string, now = new Date()) {
    const rep = await this.prisma.scheduledRep.create({
      data: {
        userId,
        scheduledAt: now,
        type: "RU_TO_EN_SPEAKING",
        status: "PLANNED"
      }
    });
    await this.enqueueRep(rep, now);
    return rep;
  }

  async markSent(repId: string) {
    return this.prisma.scheduledRep.update({ where: { id: repId }, data: { status: "SENT" } });
  }

  async startRep(repId: string, mode: "VOICE" | "TEXT" = "VOICE") {
    return this.prisma.scheduledRep.update({ where: { id: repId }, data: { status: "STARTED" } });
  }

  async attachDrill(repId: string, drillId: string) {
    return this.prisma.scheduledRep.update({ where: { id: repId }, data: { drillId } });
  }

  async skipRep(repId: string) {
    return this.prisma.scheduledRep.update({ where: { id: repId }, data: { status: "SKIPPED" } });
  }

  async snoozeRep(repId: string, minutes = 30) {
    const rep = await this.prisma.scheduledRep.findUniqueOrThrow({ where: { id: repId } });
    const scheduledAt = new Date(rep.scheduledAt.getTime() + minutes * 60_000);
    const updated = await this.prisma.scheduledRep.update({
      where: { id: repId },
      data: { status: "SNOOZED", snoozeCount: rep.snoozeCount + 1, scheduledAt }
    });
    await this.enqueueRep(updated);
    return updated;
  }

  async enableTextMode(repId: string) {
    return this.prisma.scheduledRep.update({ where: { id: repId }, data: { status: "STARTED" } });
  }

  async sendScheduledRepMessage(repId: string, bot: Bot) {
    const rep = await this.prisma.scheduledRep.findUniqueOrThrow({ where: { id: repId }, include: { user: true } });
    if (rep.user.isPaused || rep.status !== "PLANNED") return rep;
    await bot.api.sendMessage(Number(rep.user.telegramId), ruMessages.scheduledRepPrompt, { reply_markup: scheduledRepKeyboard(rep.id) });
    await this.markSent(rep.id);
    if (this.boss) {
      await this.boss.send(scheduledRepReminderQueue, { scheduledRepId: rep.id }, { startAfter: new Date(Date.now() + 20 * 60_000) });
    }
    return rep;
  }

  async sendSoftReminder(repId: string, bot: Bot) {
    const rep = await this.prisma.scheduledRep.findUniqueOrThrow({ where: { id: repId }, include: { user: true } });
    if (rep.status !== "SENT" || rep.reminderSentAt) return rep;
    await bot.api.sendMessage(Number(rep.user.telegramId), ruMessages.softReminder, { reply_markup: scheduledRepKeyboard(rep.id) });
    return this.prisma.scheduledRep.update({ where: { id: rep.id }, data: { reminderSentAt: new Date() } });
  }

  private async shouldSuppressUserReps(userId: string, targetToday: number) {
    const [skipsToday, completedToday] = await Promise.all([
      this.prisma.scheduledRep.count({ where: { userId, status: "SKIPPED" } }),
      this.prisma.scheduledRep.count({ where: { userId, status: "COMPLETED" } })
    ]);
    return shouldSuppressScheduledReps({ skipsToday, ignoredInRow: 0, completedToday, targetToday, isPaused: false });
  }

  private targetDrillCountForUser(user: Pick<User, "createdAt" | "firstWeekDrillCount" | "dailyDrillCount">, now: Date) {
    const daysSinceStart = Math.floor((now.getTime() - user.createdAt.getTime()) / 86_400_000);
    return daysSinceStart < 7 ? user.firstWeekDrillCount : user.dailyDrillCount;
  }

  private async enqueueRep(rep: ScheduledRep, startAfter = rep.scheduledAt) {
    if (!this.boss) return;
    await this.boss.send(scheduledRepQueue, { scheduledRepId: rep.id }, { startAfter });
  }
}

function startOfUtcDay(day: Date) {
  return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 0, 0, 0, 0));
}

function readScheduleWindows(value: unknown): string[] {
  if (!Array.isArray(value)) return ["morning", "afternoon", "evening"];
  const windows = value.filter((item): item is string => typeof item === "string");
  return windows.length ? windows : ["morning", "afternoon", "evening"];
}
