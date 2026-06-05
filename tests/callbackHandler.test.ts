import { describe, expect, test } from "vitest";
import { isExpiredCallbackQueryError } from "../src/apps/bot/handlers/callbackHandler.js";

describe("callback handler", () => {
  test("recognizes expired Telegram callback answer errors as non-blocking", () => {
    const error = new Error("Call to 'answerCallbackQuery' failed! (400: Bad Request: query is too old and response timeout expired or query ID is invalid)");

    expect(isExpiredCallbackQueryError(error)).toBe(true);
  });

  test("does not treat unrelated callback errors as expired callbacks", () => {
    expect(isExpiredCallbackQueryError(new Error("Forbidden: bot was blocked by the user"))).toBe(false);
  });
});
