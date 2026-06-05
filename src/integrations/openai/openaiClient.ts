import OpenAI from "openai";
import { env } from "../../utils/env.js";

export function createOpenAiClient() {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for production OpenAI provider.");
  }
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}
