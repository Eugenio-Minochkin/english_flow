import { describe, expect, test } from "vitest";
import { checkCountLimit } from "../src/utils/rateLimit.js";

describe("cost limits", () => {
  test("allows while count is below max", () => {
    expect(checkCountLimit(79, 80)).toEqual({ allowed: true, remaining: 1 });
  });

  test("blocks when count reaches max", () => {
    expect(checkCountLimit(80, 80)).toEqual({ allowed: false, remaining: 0 });
  });
});
