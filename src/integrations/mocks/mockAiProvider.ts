import type {
  AiProvider,
  AnalyzeAttemptInput,
  CreateVocabularyCardInput,
  DrillGenerationResult,
  FeedbackResult,
  GenerateDrillInput,
  TransformThoughtInput,
  ThoughtTransformResult,
  VocabularyCardResult
} from "../../core/drills/drill.types.js";

export class MockAiProvider implements AiProvider {
  async generateDrill(_input: GenerateDrillInput): Promise<DrillGenerationResult> {
    return {
      type: "RU_TO_EN_SPEAKING",
      prompt_ru: "Я вроде понимаю идею, но когда начинаю говорить, предложение разваливается.",
      prompt_en: null,
      target_words: ["get the idea", "falls apart"],
      target_patterns: ["I get ..., but when ..."],
      target_grammar: ["present simple"],
      topic: "speaking",
      difficulty: "A2-B1",
      expected_answer_notes: "Natural spoken sentence.",
      follow_up_variations: []
    };
  }

  async analyzeAttempt(input: AnalyzeAttemptInput): Promise<FeedbackResult> {
    return {
      meaning_score: 8,
      grammar_score: 7,
      naturalness_score: 7,
      meaning_ok: true,
      main_issue_type: "russian_structure",
      main_issue_ru: "Фраза понятна, но звучит немного как дословный перевод с русского.",
      user_transcription: input.userTranscription,
      better_version_en: "I get the idea, but when I start speaking, the sentence falls apart.",
      advanced_version_en: "I understand the idea, but once I start speaking, the sentence falls apart.",
      short_explanation_ru: "Так звучит естественнее в разговорном английском.",
      repeat_task_ru: "Повтори вслух: I get the idea, but when I start speaking, the sentence falls apart.",
      detected_weaknesses: [],
      review_updates: [],
      should_repeat_now: true
    };
  }

  async createVocabularyCard(input: CreateVocabularyCardInput): Promise<VocabularyCardResult> {
    const normalized = input.word.trim().toLowerCase();
    return {
      word: input.word.trim(),
      normalized_word: normalized,
      part_of_speech: "verb",
      meaning_en: `to use "${normalized}" naturally in spoken English`,
      translation_ru: "практическое слово для речи",
      ipa: null,
      pronunciation_hint_ru: "произнеси спокойно и слитно",
      examples: [`I want to use ${normalized} correctly in a real sentence.`],
      collocations: [`use ${normalized}`, `${normalized} naturally`],
      tags: ["mock"],
      word_family: {
        verb: normalized,
        noun: null,
        adjective: null,
        adverb: null,
        phrases: [`use ${normalized}`],
        examples: [`Try to use ${normalized} in your next answer.`]
      }
    };
  }

  async transformThought(_input: TransformThoughtInput): Promise<ThoughtTransformResult> {
    return {};
  }
}
