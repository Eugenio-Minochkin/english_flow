import { describe, expect, test } from "vitest";
import { planRepTimesForDay, shouldSuppressScheduledReps } from "../src/core/scheduling/scheduling.service.js";

describe("scheduled reps planning", () => {
  test("plans three first-week reps inside the configured active windows", () => {
    const reps = planRepTimesForDay(new Date("2026-06-04T00:00:00.000Z"), 3, "Asia/Bangkok");

    expect(reps).toHaveLength(3);
    expect(reps.map((rep) => rep.window)).toEqual(["morning", "afternoon", "evening"]);
    expect(reps.every((rep) => rep.localTime >= "10:00" && rep.localTime <= "21:30")).toBe(true);
  });

  test("plans five later reps without quiet-hour slots", () => {
    const reps = planRepTimesForDay(new Date("2026-06-04T00:00:00.000Z"), 5, "Asia/Bangkok");

    expect(reps).toHaveLength(5);
    expect(reps.every((rep) => rep.localTime >= "10:00" && rep.localTime <= "21:30")).toBe(true);
  });

  test("suppresses remaining reps after three skips in one day", () => {
    expect(shouldSuppressScheduledReps({ skipsToday: 3, ignoredInRow: 0, completedToday: 0, targetToday: 3, isPaused: false })).toBe(true);
  });

  test("suppresses reps when user is paused or completed the daily target", () => {
    expect(shouldSuppressScheduledReps({ skipsToday: 0, ignoredInRow: 0, completedToday: 3, targetToday: 3, isPaused: false })).toBe(true);
    expect(shouldSuppressScheduledReps({ skipsToday: 0, ignoredInRow: 0, completedToday: 0, targetToday: 3, isPaused: true })).toBe(true);
  });
});
