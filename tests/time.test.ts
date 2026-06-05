import { describe, expect, test } from "vitest";
import { isInQuietHours } from "../src/utils/time.js";

describe("quiet hours", () => {
  test("handles quiet window crossing midnight", () => {
    expect(isInQuietHours("22:30", "22:00", "10:00")).toBe(true);
    expect(isInQuietHours("09:59", "22:00", "10:00")).toBe(true);
    expect(isInQuietHours("10:00", "22:00", "10:00")).toBe(false);
    expect(isInQuietHours("15:00", "22:00", "10:00")).toBe(false);
  });
});
