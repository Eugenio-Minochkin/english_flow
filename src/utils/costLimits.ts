import type { PrismaClient } from "@prisma/client";
import { env } from "./env.js";
import { checkCountLimit } from "./rateLimit.js";

export async function canUseAiToday(prisma: PrismaClient, userId: string, now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const count = await prisma.usageLog.count({
    where: { userId, provider: "openai", createdAt: { gte: start } }
  });
  return checkCountLimit(count, env.MAX_AI_CALLS_PER_USER_PER_DAY);
}

export async function canSubmitVoiceToday(prisma: PrismaClient, userId: string, now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const count = await prisma.usageLog.count({
    where: { userId, provider: "deepgram", operation: "stt", createdAt: { gte: start } }
  });
  return checkCountLimit(count, env.MAX_VOICE_ATTEMPTS_PER_USER_PER_DAY);
}
