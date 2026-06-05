import { describe, expect, test } from "vitest";
import { isTelegramUserAllowed, parseAllowedTelegramIds } from "../src/auth/allowlist.js";

describe("Telegram allowlist", () => {
  test("allows only ids explicitly listed", () => {
    const ids = parseAllowedTelegramIds("123, 456");
    expect(isTelegramUserAllowed(123, ids)).toBe(true);
    expect(isTelegramUserAllowed(456n, ids)).toBe(true);
    expect(isTelegramUserAllowed(789, ids)).toBe(false);
  });

  test("denies everyone when allowlist is empty", () => {
    expect(isTelegramUserAllowed(123, parseAllowedTelegramIds(""))).toBe(false);
  });
});
