import type PgBoss from "pg-boss";
import type { ScheduledRepService } from "../../core/scheduling/scheduledRep.service.js";
import { dailyPlanQueue } from "../../core/scheduling/scheduling.queues.js";
import { logger } from "../../utils/logger.js";

export class DailyPlanWorker {
  constructor(
    private readonly boss: PgBoss,
    private readonly scheduledRepService: ScheduledRepService
  ) {}

  async start() {
    await this.boss.createQueue(dailyPlanQueue);
    await this.scheduledRepService.createDailyPlansForAllUsers(new Date());
    await this.boss.schedule(dailyPlanQueue, "5 3 * * *", {});
    await this.boss.work(dailyPlanQueue, async (jobOrJobs) => {
      const job = Array.isArray(jobOrJobs) ? jobOrJobs[0] : jobOrJobs;
      await this.scheduledRepService.createDailyPlansForAllUsers(new Date());
      logger.info({ jobId: job?.id }, "daily plan job received");
    });
  }
}
