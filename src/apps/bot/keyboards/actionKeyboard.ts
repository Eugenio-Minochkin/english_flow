import { InlineKeyboard, Keyboard } from "grammy";

export const actionLabels = {
  newDrill: "🎯 Новый подход",
  repeat: "🎙 Повторить",
  stop: "⏸ Остановить",
  scheduledStart: "▶️ Начать",
  scheduledSnooze: "⏰ Отложить на 30 мин",
  scheduledTextMode: "⌨️ Текстом",
  scheduledSkip: "⏭ Пропустить"
};

export const mainMenuLabels = {
  newDrill: "🎯 Новый подход",
  schedule: "🗓 Расписание",
  words: "🧩 Слова",
  review: "🔁 Повторение",
  lessonImport: "📚 Импорт урока",
  stats: "📊 Статистика",
  settings: "⚙️ Настройки"
};

export const actionCallbacks = {
  newDrill: "action:new_drill",
  repeat: "action:repeat",
  stop: "action:stop",
  scheduledStart: "scheduled:start",
  scheduledSnooze: "scheduled:snooze",
  scheduledTextMode: "scheduled:text_mode",
  scheduledSkip: "scheduled:skip"
};

export const vocabularyCallbacks = {
  add: "vocabulary:add",
  list: "vocabulary:list"
};

export type ScheduledRepCallbackAction = "start" | "snooze" | "text_mode" | "skip";
export type ScheduleSetupAction = "count" | "window" | "save";

export function scheduledRepCallback(action: ScheduledRepCallbackAction, repId: string) {
  return `scheduled:${action}:${repId}`;
}

export function parseScheduledRepCallback(data: string): { action: ScheduledRepCallbackAction; repId: string } | null {
  const match = data.match(/^scheduled:(start|snooze|text_mode|skip):(.+)$/);
  if (!match) return null;
  return { action: match[1] as ScheduledRepCallbackAction, repId: match[2] };
}

export function scheduleSetupCallback(action: ScheduleSetupAction, value?: string) {
  return value ? `schedule:${action}:${value}` : `schedule:${action}`;
}

export function parseScheduleSetupCallback(data: string): { action: ScheduleSetupAction; value?: string } | null {
  const match = data.match(/^schedule:(count|window|save)(?::(.+))?$/);
  if (!match) return null;
  return { action: match[1] as ScheduleSetupAction, value: match[2] };
}

export function mainMenuKeyboard() {
  return new Keyboard()
    .text(mainMenuLabels.newDrill)
    .text(mainMenuLabels.schedule)
    .row()
    .text(mainMenuLabels.words)
    .text(mainMenuLabels.review)
    .row()
    .text(mainMenuLabels.lessonImport)
    .row()
    .text(mainMenuLabels.stats)
    .text(mainMenuLabels.settings)
    .resized()
    .persistent();
}

export function mainActionKeyboard() {
  return new InlineKeyboard()
    .text(actionLabels.newDrill, actionCallbacks.newDrill)
    .row()
    .text(actionLabels.stop, actionCallbacks.stop);
}

export function feedbackActionKeyboard() {
  return new InlineKeyboard()
    .text(actionLabels.repeat, actionCallbacks.repeat)
    .row()
    .text(actionLabels.newDrill, actionCallbacks.newDrill)
    .text(actionLabels.stop, actionCallbacks.stop);
}

export function scheduledRepKeyboard(repId: string) {
  return new InlineKeyboard()
    .text(actionLabels.scheduledStart, scheduledRepCallback("start", repId))
    .row()
    .text(actionLabels.scheduledSnooze, scheduledRepCallback("snooze", repId))
    .row()
    .text(actionLabels.scheduledTextMode, scheduledRepCallback("text_mode", repId))
    .text(actionLabels.scheduledSkip, scheduledRepCallback("skip", repId));
}

export function scheduleSetupKeyboard() {
  return new InlineKeyboard()
    .text("3 подхода", scheduleSetupCallback("count", "3"))
    .text("5 подходов", scheduleSetupCallback("count", "5"))
    .row()
    .text("Утро", scheduleSetupCallback("window", "morning"))
    .text("День", scheduleSetupCallback("window", "afternoon"))
    .text("Вечер", scheduleSetupCallback("window", "evening"))
    .row()
    .text("Сохранить", scheduleSetupCallback("save"));
}

export function vocabularyMenuKeyboard() {
  return new InlineKeyboard()
    .text("➕ Добавить слово", vocabularyCallbacks.add)
    .row()
    .text("📚 Мои слова", vocabularyCallbacks.list);
}
