export type RepWindowName = "morning" | "afternoon" | "evening" | "extra";

export type PlannedRepTime = {
  window: RepWindowName;
  localTime: string;
  scheduledAt: Date;
};

export type AntiAnnoyanceInput = {
  skipsToday: number;
  ignoredInRow: number;
  completedToday: number;
  targetToday: number;
  isPaused: boolean;
};

const threeRepTimes: Array<Omit<PlannedRepTime, "scheduledAt">> = [
  { window: "morning", localTime: "10:30" },
  { window: "afternoon", localTime: "14:30" },
  { window: "evening", localTime: "19:30" }
];

const fiveRepTimes: Array<Omit<PlannedRepTime, "scheduledAt">> = [
  { window: "morning", localTime: "10:30" },
  { window: "extra", localTime: "12:15" },
  { window: "afternoon", localTime: "14:30" },
  { window: "extra", localTime: "17:30" },
  { window: "evening", localTime: "19:30" }
];

export function planRepTimesForDay(day: Date, targetCount: number, timezone = "Asia/Bangkok", selectedWindows?: string[]): PlannedRepTime[] {
  const templates = targetCount <= 3 ? threeRepTimes : fiveRepTimes;
  const selected = selectedWindows?.length ? selectedWindows : ["morning", "afternoon", "evening", "extra"];
  return templates
    .filter((template) => selected.includes(template.window) || (template.window === "extra" && selected.includes("afternoon")))
    .slice(0, targetCount)
    .map((template) => ({
    ...template,
    scheduledAt: zonedLocalTimeToUtc(day, template.localTime, timezone)
  }));
}

export function shouldSuppressScheduledReps(input: AntiAnnoyanceInput): boolean {
  if (input.isPaused) return true;
  if (input.skipsToday >= 3) return true;
  return input.targetToday > 0 && input.completedToday >= input.targetToday;
}

export function shouldMoveNextRepToEvening(input: Pick<AntiAnnoyanceInput, "ignoredInRow">): boolean {
  return input.ignoredInRow >= 2;
}

function zonedLocalTimeToUtc(day: Date, localTime: string, timezone: string) {
  const [hour, minute] = localTime.split(":").map(Number);
  const utcDate = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hour, minute, 0, 0));
  if (timezone !== "Asia/Bangkok") return utcDate;
  return new Date(utcDate.getTime() - 7 * 60 * 60 * 1000);
}
