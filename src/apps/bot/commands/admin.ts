import type { Bot } from "grammy";
import type { ScheduledRepService } from "../../../core/scheduling/scheduledRep.service.js";
import { ruMessages } from "../messages/ru.js";
import type { BotContext } from "../context.js";

export function registerAdminCommands(bot: Bot<BotContext>, scheduledRepService: ScheduledRepService) {
  bot.command("admin_plan_today", async (ctx) => {
    if (!ctx.englishFlowUser?.isAdmin) return ctx.reply(ruMessages.adminOnly);
    const plan = await scheduledRepService.createDailyPlanForUser(ctx.englishFlowUser, new Date());
    await ctx.reply(ruMessages.adminPlanCreated(plan.targetDrillCount));
  });

  bot.command("admin_due", async (ctx) => {
    if (!ctx.englishFlowUser?.isAdmin) return ctx.reply(ruMessages.adminOnly);
    const reps = await scheduledRepService.listUpcomingReps(ctx.englishFlowUser.id, 8);
    await ctx.reply(ruMessages.adminDue(reps));
  });

  bot.command("admin_send_rep_now", async (ctx) => {
    if (!ctx.englishFlowUser?.isAdmin) return ctx.reply(ruMessages.adminOnly);
    const rep = await scheduledRepService.sendRepNow(ctx.englishFlowUser.id);
    await scheduledRepService.sendScheduledRepMessage(rep.id, bot);
    await ctx.reply(ruMessages.adminRepSent(rep.id));
  });
}
