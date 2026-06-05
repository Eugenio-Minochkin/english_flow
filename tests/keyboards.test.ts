import { describe, expect, test } from "vitest";
import {
  actionLabels,
  mainMenuLabels,
  mainMenuKeyboard,
  parseScheduleSetupCallback,
  parseScheduledRepCallback,
  scheduleSetupKeyboard,
  scheduledRepKeyboard
} from "../src/apps/bot/keyboards/actionKeyboard.js";

describe("Telegram action keyboards", () => {
  test("uses Russian labels for action buttons", () => {
    expect(actionLabels.newDrill).toBe("🎯 Новый подход");
    expect(actionLabels.repeat).toBe("🎙 Повторить");
    expect(actionLabels.stop).toBe("⏸ Остановить");
  });

  test("encodes and parses scheduled rep callback data with rep id", () => {
    const keyboard = scheduledRepKeyboard("rep-1");
    expect(keyboard).toBeDefined();
    expect(parseScheduledRepCallback("scheduled:start:rep-1")).toEqual({ action: "start", repId: "rep-1" });
    expect(parseScheduledRepCallback("scheduled:snooze:rep-1")).toEqual({ action: "snooze", repId: "rep-1" });
    expect(parseScheduledRepCallback("action:new_drill")).toBeNull();
  });

  test("provides a persistent Russian main menu", () => {
    expect(mainMenuLabels).toEqual({
      newDrill: "🎯 Новый подход",
      schedule: "🗓 Расписание",
      words: "🧩 Слова",
      review: "🔁 Повторение",
      lessonImport: "📚 Импорт урока",
      stats: "📊 Статистика",
      settings: "⚙️ Настройки"
    });
    expect(mainMenuKeyboard()).toBeDefined();
  });

  test("encodes schedule setup callbacks", () => {
    expect(scheduleSetupKeyboard()).toBeDefined();
    expect(parseScheduleSetupCallback("schedule:count:3")).toEqual({ action: "count", value: "3" });
    expect(parseScheduleSetupCallback("schedule:window:morning")).toEqual({ action: "window", value: "morning" });
    expect(parseScheduleSetupCallback("schedule:save")).toEqual({ action: "save", value: undefined });
    expect(parseScheduleSetupCallback("scheduled:start:rep-1")).toBeNull();
  });
});
