import type { MiddlewareFn } from "grammy";
import { env } from "../../utils/env.js";
import { parseAllowedTelegramIds, isTelegramUserAllowed } from "../../auth/allowlist.js";
import { ruMessages } from "./messages/ru.js";
import type { BotContext } from "./context.js";
import type { UserService } from "../../core/users/user.service.js";

const allowedIds = parseAllowedTelegramIds(env.ALLOWED_TELEGRAM_IDS);

export function allowlistedUserMiddleware(userService: UserService): MiddlewareFn<BotContext> {
  return async (ctx, next) => {
    const from = ctx.from;
    if (!from || !isTelegramUserAllowed(from.id, allowedIds)) {
      await ctx.reply(ruMessages.accessDenied);
      return;
    }
    ctx.englishFlowUser = await userService.findOrCreateFromTelegram(from);
    await next();
  };
}
