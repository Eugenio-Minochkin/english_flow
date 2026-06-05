import pino from "pino";
import { env } from "./env.js";

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: ["TELEGRAM_BOT_TOKEN", "OPENAI_API_KEY", "DEEPGRAM_API_KEY", "*.token", "*.authorization"]
});
