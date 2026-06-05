import type PgBoss from "pg-boss";
import type { Bot } from "grammy";
import type { ScheduledRepService } from "../../core/scheduling/scheduledRep.service.js";
import { scheduledRepQueue, scheduledRepReminderQueue } from "../../core/scheduling/scheduling.queues.js";
import { logger } from "../../utils/logger.js";

export class ScheduledRepWorker {
  constructor(
    private readonly boss: PgBoss,
    private readonly scheduledRepService: ScheduledRepService,
    private readonly bot: Bot | null
  ) {}

  async start() {
    await this.boss.createQueue(scheduledRepQueue);
    await this.boss.createQueue(scheduledRepReminderQueue);
    await this.boss.work(scheduledRepQueue, async (jobOrJobs) => {
      const job = Array.isArray(jobOrJobs) ? jobOrJobs[0] : jobOrJobs;
      if (this.bot && job?.data && typeof (job.data as { scheduledRepId?: unknown }).scheduledRepId === "string") {
        await this.scheduledRepService.sendScheduledRepMessage((job.data as { scheduledRepId: string }).scheduledRepId, this.bot);
      }
      logger.info({ jobId: job?.id }, "scheduled rep send job received");
    });
    await this.boss.work(scheduledRepReminderQueue, async (jobOrJobs) => {
      const job = Array.isArray(jobOrJobs) ? jobOrJobs[0] : jobOrJobs;
      if (this.bot && job?.data && typeof (job.data as { scheduledRepId?: unknown }).scheduledRepId === "string") {
        await this.scheduledRepService.sendSoftReminder((job.data as { scheduledRepId: string }).scheduledRepId, this.bot);
      }
      logger.info({ jobId: job?.id }, "scheduled rep reminder job received");
    });
  }
}
