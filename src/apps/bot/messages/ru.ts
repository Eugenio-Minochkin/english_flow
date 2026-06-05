import type { FeedbackResult, VocabularyCardResult } from "../../../core/drills/drill.types.js";
import { escapeHtml } from "./html.js";

type ScheduleSetupView = {
  count: number;
  windows: string[];
  quietHoursStart: string;
  quietHoursEnd: string;
};

const windowNames: Record<string, string> = {
  morning: "утро",
  afternoon: "день",
  evening: "вечер",
  extra: "дополнительно"
};

function formatList(items: string[] | undefined) {
  return items?.length ? items.map(escapeHtml).join(", ") : "—";
}

export const ruMessages = {
  accessDenied: "Доступ запрещён.",
  start: "Привет. Это English Flow: короткие голосовые подходы для английского. Кнопки уже в меню снизу.",
  help: [
    "Команды:",
    "/start — начать",
    "/drill — новый 60-секундный подход",
    "/word — добавить слово",
    "/lesson_after — импорт слов после урока",
    "/help — помощь",
    "",
    "Можно не печатать команды: основные действия есть в меню снизу."
  ].join("\n"),
  unknownText: "Я пока не понял этот текст. Выбери действие в меню снизу или нажми «Новый подход».",
  sendVoiceAnswer: "🎙 <b>Скажи ответ голосом по-английски.</b>",
  repeatHint: "🎙 <b>Теперь повтори улучшенную фразу голосом.</b>",
  stopped: "Ок, остановил. Когда захочешь продолжить, нажми «Новый подход».",
  waitingRepeat: "Отлично. Теперь повтори улучшенную фразу голосом или нажми «Новый подход» для нового подхода.",
  noActiveDrill: "Сейчас нет активного подхода. Нажми «Новый подход», чтобы начать.",
  repeatAcceptedText: "Повтор принят. Для нового подхода нажми «Новый подход».",
  sttFailed: "Не смог разобрать аудио. Попробуй ещё раз или используй текстовый режим.",
  aiFailed: "Ответ записал, но сейчас не смог нормально проверить. Попробуй ещё раз позже.",
  limitAi: "На сегодня лимит AI-проверок исчерпан. Можно продолжить завтра или использовать текстовый режим без анализа.",
  limitVoice: "На сегодня лимит голосовых попыток исчерпан. Можно продолжить завтра.",
  genericError: "Что-то пошло не так. Попробуй ещё раз.",
  statsComingSoon: "Статистика появится позже.",
  settingsComingSoon: "Настройки появятся позже.",
  reviewComingSoon: "Повторения появятся позже.",
  shadowComingSoon: "Shadowing появится в одном из следующих этапов.",
  lessonAfterComingSoon: "Импорт урока появится позже.",
  thoughtComingSoon: "Трансформация мыслей появится позже.",
  wordComingSoon: "Карточки слов появятся в следующем этапе.",
  askWordInput: "Напиши слово или фразу на английском, для которой сделать карточку.",
  askLessonImportInput: "Пришли слова после урока списком: через строки, запятые или точки с запятой.",
  wordSaved: "Карточка слова сохранена.",
  noVocabularyForReview: "Пока нет слов для повторения. Добавь слово через «Слова».",
  scheduleSaved: "Расписание сохранено.",
  callbackSendVoiceRepeat: "Отправь голосовой повтор.",
  callbackUnknownAction: "Неизвестное действие.",
  adminOnly: "Эта команда доступна только администратору.",
  scheduledRepPrompt: "60-секундный английский подход?",
  scheduledRepStarted: "Начинаем подход.",
  scheduledRepSnoozed: "Ок, отложил на 30 минут.",
  scheduledRepSkipped: "Ок, пропустил этот подход.",
  scheduledRepTextMode: "Ок, можно ответить текстом.",
  softReminder: "Мягкое напоминание: можно сделать короткий английский подход.",
  adminPlanCreated(targetDrillCount: number) {
    return `План на сегодня создан. Подходов: ${targetDrillCount}.`;
  },
  adminRepQueued(repId: string) {
    return `Запланированный подход поставлен в очередь: ${repId}.`;
  },
  adminRepSent(repId: string) {
    return `Тестовый подход отправлен: ${repId}.`;
  },
  adminDue(reps: Array<{ id: string; status: string; scheduledAt: Date }>) {
    if (reps.length === 0) return "Запланированных подходов пока нет.";
    return reps.map((rep) => `${rep.id} — ${rep.status} — ${rep.scheduledAt.toISOString()}`).join("\n");
  },
  voiceTooLong(durationSeconds: number, maxSeconds: number) {
    return `Это аудио слишком длинное: ${durationSeconds} сек. Максимум — ${maxSeconds} секунд. Запиши короткий ответ ещё раз.`;
  },
  lessonImportSaved(count: number) {
    return `Импорт урока сохранён. Карточек создано: ${count}.`;
  },
  scheduleSetup(input: ScheduleSetupView) {
    const windows = input.windows.map((window) => windowNames[window] ?? window).join(", ");
    return [
      "🗓 <b>Расписание</b>",
      "",
      `Подходов в день: <b>${input.count}</b>`,
      `Окна: <b>${escapeHtml(windows)}</b>`,
      `Тихие часы: <b>${escapeHtml(input.quietHoursStart)}–${escapeHtml(input.quietHoursEnd)}</b>`,
      "",
      "Выбери количество и окна. Внутри окна бот сам подберёт время."
    ].join("\n");
  },
  vocabularyCard(card: VocabularyCardResult) {
    return [
      `🧩 <b>${escapeHtml(card.word)}</b>${card.part_of_speech ? ` · ${escapeHtml(card.part_of_speech)}` : ""}`,
      card.ipa ? `/${escapeHtml(card.ipa.replaceAll("/", ""))}/` : "",
      "",
      `<b>Meaning:</b> ${escapeHtml(card.meaning_en)}`,
      `<b>Перевод:</b> ${escapeHtml(card.translation_ru)}`,
      card.pronunciation_hint_ru ? `<b>Произношение:</b> ${escapeHtml(card.pronunciation_hint_ru)}` : "",
      "",
      `<b>Examples:</b>\n${card.examples.map((example) => `• ${escapeHtml(example)}`).join("\n")}`,
      "",
      `<b>Collocations:</b> ${formatList(card.collocations)}`,
      `<b>Word family:</b> ${formatList([
        card.word_family.verb,
        card.word_family.noun,
        card.word_family.adjective,
        card.word_family.adverb,
        ...(card.word_family.phrases ?? [])
      ].filter((item): item is string => Boolean(item)))}`
    ]
      .filter(Boolean)
      .join("\n");
  },
  repeatAccepted(transcription: string, betterVersionEn: string) {
    return [
      "✅ <b>Повтор принят.</b>",
      "",
      `🎧 <b>Я услышал:</b>\n${escapeHtml(transcription || "Не удалось уверенно разобрать повтор.")}`,
      "",
      betterVersionEn ? `🎯 <b>Целевая фраза:</b>\n${escapeHtml(betterVersionEn)}` : "",
      "",
      "🎯 <b>Новый подход:</b>\nНажми /drill или кнопку «Новый подход»."
    ]
      .filter(Boolean)
      .join("\n");
  },
  drillPrompt(promptRu: string) {
    return `🎯 <b>Скажи по-английски:</b>\n\n${escapeHtml(promptRu)}`;
  },
  feedback(feedback: FeedbackResult) {
    return [
      `🎧 <b>Я услышал:</b>\n${escapeHtml(feedback.user_transcription)}`,
      "",
      `${feedback.meaning_ok ? "✅" : "⚠️"} <b>Смысл:</b> ${feedback.meaning_ok ? "ок" : "нужно поправить"}`,
      "",
      `🎯 <b>Главная правка:</b>\n${escapeHtml(feedback.main_issue_ru)}`,
      "",
      `💬 <b>Лучше:</b>\n${escapeHtml(feedback.better_version_en)}`,
      "",
      `🧠 <b>Почему:</b>\n${escapeHtml(feedback.short_explanation_ru)}`,
      "",
      `🎙 <b>Теперь повтори:</b>\n${escapeHtml(feedback.better_version_en)}`
    ].join("\n");
  }
};
