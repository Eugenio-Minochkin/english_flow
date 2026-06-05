import type { AudioResult, TtsInput, TtsProvider } from "../../core/drills/drill.types.js";

export class MockTtsProvider implements TtsProvider {
  async synthesizeSpeech(_input: TtsInput): Promise<AudioResult> {
    return { audio: Buffer.from("mock"), mimeType: "audio/mpeg" };
  }
}
