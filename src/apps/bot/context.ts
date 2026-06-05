import type { Context } from "grammy";
import type { User } from "@prisma/client";

export type BotContext = Context & {
  englishFlowUser?: User;
};
