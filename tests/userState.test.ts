import { describe, expect, test } from "vitest";

type State = "IDLE" | "WAITING_FOR_DRILL_ANSWER" | "WAITING_FOR_REPEAT";

function nextState(current: State, event: "start_drill" | "submit_attempt" | "reset"): State {
  if (event === "reset") return "IDLE";
  if (current === "IDLE" && event === "start_drill") return "WAITING_FOR_DRILL_ANSWER";
  if (current === "WAITING_FOR_DRILL_ANSWER" && event === "submit_attempt") return "WAITING_FOR_REPEAT";
  return current;
}

describe("user state transitions", () => {
  test("moves through milestone 1 drill flow", () => {
    const waiting = nextState("IDLE", "start_drill");
    const repeat = nextState(waiting, "submit_attempt");
    expect(waiting).toBe("WAITING_FOR_DRILL_ANSWER");
    expect(repeat).toBe("WAITING_FOR_REPEAT");
    expect(nextState(repeat, "reset")).toBe("IDLE");
  });
});
