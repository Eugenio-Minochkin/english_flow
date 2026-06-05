import PgBoss from "pg-boss";
import { Bot } from "grammy";
import { prisma } from "../../db/prisma.js";
import { ScheduledRepService } from "../../core/scheduling/scheduledRep.service.js";
import { env } from "../../utils/env.js";
import { logger } from "../../utils/logger.js";
import { isMainModule } from "../../utils/module.js";
import { DailyPlanWorker } from "./dailyPlanWorker.js";
import { ScheduledRepWorker } from "./scheduledRepWorker.js";

export async function createBoss() {
  const boss = new PgBoss({ connectionString: env.DATABASE_URL });
  boss.on("error", (error) => logger.error({ err: error }, "pg-boss error"));
  await boss.start();
  return boss;
}

export async function startWorker() {
  const boss = await createBoss();
  const scheduledRepService = new ScheduledRepService(prisma, boss);
  const bot = env.TELEGRAM_BOT_TOKEN ? new Bot(env.TELEGRAM_BOT_TOKEN) : null;
  await new ScheduledRepWorker(boss, scheduledRepService, bot).start();
  await new DailyPlanWorker(boss, scheduledRepService).start();
  logger.info("Worker process started with pg-boss. Scheduled rep handlers are ready for Milestone 2.");
  return boss;
}

if (isMainModule(import.meta.url)) {
  startWorker().catch((error) => {
    logger.error({ err: error }, "worker failed");
    process.exit(1);
  });
}
