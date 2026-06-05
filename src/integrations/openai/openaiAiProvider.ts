import type OpenAI from "openai";
import type {
  AiProvider,
  AnalyzeAttemptInput,
  CreateVocabularyCardInput,
  DrillGenerationResult,
  FeedbackResult,
  GenerateDrillInput,
  GenerateTransferDrillInput,
  TransformThoughtInput,
  ThoughtTransformResult,
  VocabularyCardResult
} from "../../core/drills/drill.types.js";
import { env } from "../../utils/env.js";
import {
  drillGenerationJsonSchema,
  drillGenerationSchema,
  feedbackJsonSchema,
  feedbackSchema,
  vocabularyCardJsonSchema,
  vocabularyCardSchema
} from "./schemas.js";
import { DRILL_GENERATION_PROMPT, FEEDBACK_PROMPT, TRANSFER_DRILL_PROMPT, VOCABULARY_CARD_PROMPT } from "./prompts.js";

export class OpenAiProvider implements AiProvider {
  constructor(private readonly client: OpenAI) {}

  async generateDrill(_input: GenerateDrillInput): Promise<DrillGenerationResult> {
    const response = await this.client.chat.completions.create({
      model: env.OPENAI_MODEL,
      response_format: { type: "json_schema", json_schema: drillGenerationJsonSchema } as never,
      messages: [
        { role: "system", content: DRILL_GENERATION_PROMPT.system },
        {
          role: "user",
          content: "Generate one RU_TO_EN_SPEAKING drill for a Russian-speaking learner. Use practical topics: work, IT, friends, Chiang Mai, AI projects, feelings, relationships, travel. The Russian prompt must be a natural thought the learner should say in English."
        }
      ]
    });
    const content = response.choices[0]?.message.content ?? "{}";
    return drillGenerationSchema.parse(JSON.parse(content));
  }

  async generateTransferDrill(input: GenerateTransferDrillInput): Promise<DrillGenerationResult> {
    const response = await this.client.chat.completions.create({
      model: env.OPENAI_MODEL,
      response_format: { type: "json_schema", json_schema: drillGenerationJsonSchema } as never,
      messages: [
        { role: "system", content: TRANSFER_DRILL_PROMPT.system },
        { role: "user", content: JSON.stringify(input) }
      ]
    });
    const content = response.choices[0]?.message.content ?? "{}";
    return drillGenerationSchema.parse(JSON.parse(content));
  }

  async analyzeAttempt(input: AnalyzeAttemptInput): Promise<FeedbackResult> {
    const response = await this.client.chat.completions.create({
      model: env.OPENAI_MODEL,
      response_format: { type: "json_schema", json_schema: feedbackJsonSchema } as never,
      messages: [
        { role: "system", content: FEEDBACK_PROMPT.system },
        { role: "user", content: JSON.stringify(input) }
      ]
    });
    const content = response.choices[0]?.message.content ?? "{}";
    return feedbackSchema.parse(JSON.parse(content));
  }

  async createVocabularyCard(input: CreateVocabularyCardInput): Promise<VocabularyCardResult> {
    const response = await this.client.chat.completions.create({
      model: env.OPENAI_MODEL,
      response_format: { type: "json_schema", json_schema: vocabularyCardJsonSchema } as never,
      messages: [
        { role: "system", content: VOCABULARY_CARD_PROMPT.system },
        { role: "user", content: JSON.stringify(input) }
      ]
    });
    const content = response.choices[0]?.message.content ?? "{}";
    return vocabularyCardSchema.parse(JSON.parse(content));
  }

  async transformThought(_input: TransformThoughtInput): Promise<ThoughtTransformResult> {
    throw new Error("Thought transformation is planned for a later milestone.");
  }
}
