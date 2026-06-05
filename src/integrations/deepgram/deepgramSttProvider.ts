import { createClient } from "@deepgram/sdk";
import { readFile } from "node:fs/promises";
import type { SttProvider, TranscribeAudioInput, TranscriptionResult } from "../../core/drills/drill.types.js";
import { env } from "../../utils/env.js";

export class DeepgramSttProvider implements SttProvider {
  private readonly client = createClient(env.DEEPGRAM_API_KEY);

  async transcribeAudio(input: TranscribeAudioInput): Promise<TranscriptionResult> {
    if (!env.DEEPGRAM_API_KEY) {
      throw new Error("DEEPGRAM_API_KEY is required for production Deepgram provider.");
    }
    const audio = await readFile(input.filePath);
    const language = input.languageMode === "ENGLISH_SPEECH" ? "en" : input.languageMode === "RUSSIAN_INPUT" ? "ru" : undefined;
    const { result, error } = await this.client.listen.prerecorded.transcribeFile(audio, {
      model: "nova-2",
      smart_format: true,
      language
    });
    if (error) throw error;
    const alternative = result.results.channels[0]?.alternatives[0];
    return {
      text: alternative?.transcript ?? "",
      durationSeconds: result.metadata?.duration
    };
  }
}
