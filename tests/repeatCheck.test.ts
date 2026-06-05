import { describe, expect, test } from "vitest";
import { compareRepeatToTarget } from "../src/core/practice/repeatCheck.js";

describe("compareRepeatToTarget", () => {
  test("passes a close repeat", () => {
    const result = compareRepeatToTarget("I worked on it yesterday", "I worked on it yesterday.");

    expect(result.success).toBe(true);
    expect(result.score).toBe(1);
    expect(result.missingWords).toEqual([]);
  });

  test("fails when key target words are missing", () => {
    const result = compareRepeatToTarget("I worked yesterday", "I worked on it yesterday.");

    expect(result.success).toBe(false);
    expect(result.score).toBeLessThan(0.75);
    expect(result.missingWords).toEqual(["on", "it"]);
  });
});
