import type { AudioResult, TtsInput, TtsProvider } from "../../core/drills/drill.types.js";

export class DeepgramTtsProvider implements TtsProvider {
  async synthesizeSpeech(_input: TtsInput): Promise<AudioResult> {
    throw new Error("Deepgram TTS is planned for a later milestone.");
  }
}
