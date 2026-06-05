import type { SttProvider, TranscribeAudioInput, TranscriptionResult } from "../../core/drills/drill.types.js";

export class MockSttProvider implements SttProvider {
  constructor(private readonly text = "I get the idea, but when I start speaking, the sentence falls apart.") {}

  async transcribeAudio(_input: TranscribeAudioInput): Promise<TranscriptionResult> {
    return { text: this.text, durationSeconds: 5 };
  }
}
