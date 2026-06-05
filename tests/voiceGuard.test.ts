import { describe, expect, test } from "vitest";
import { isVoiceTooLong } from "../src/apps/bot/handlers/voiceHandler.js";

describe("voice duration guard", () => {
  test("rejects voice messages longer than configured max before download", () => {
    expect(isVoiceTooLong(91, 90)).toBe(true);
  });

  test("allows voice messages at the configured max", () => {
    expect(isVoiceTooLong(90, 90)).toBe(false);
  });
});
