import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  TELEGRAM_BOT_TOKEN: z.string().default(""),
  TELEGRAM_WEBHOOK_SECRET: z.string().default(""),
  TELEGRAM_WEBHOOK_URL: z.string().default(""),
  ALLOWED_TELEGRAM_IDS: z.string().default(""),
  OPENAI_API_KEY: z.string().default(""),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  DEEPGRAM_API_KEY: z.string().default(""),
  DEFAULT_TIMEZONE: z.string().default("Asia/Bangkok"),
  QUIET_HOURS_START: z.string().default("22:00"),
  QUIET_HOURS_END: z.string().default("10:00"),
  MAX_AI_CALLS_PER_USER_PER_DAY: z.coerce.number().int().positive().default(80),
  MAX_VOICE_ATTEMPTS_PER_USER_PER_DAY: z.coerce.number().int().positive().default(50),
  MAX_AUDIO_DURATION_SECONDS: z.coerce.number().int().positive().default(90),
  STORE_RAW_AUDIO: z.coerce.boolean().default(false),
  LOG_LEVEL: z.string().default("info")
});

export const env = envSchema.parse(process.env);
